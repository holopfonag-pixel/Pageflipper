package eu.kanade.tachiyomi.ui.reader

import android.content.Context
import androidx.core.util.AtomicFile
import com.hippo.unifile.UniFile
import dev.zacsweers.metro.AppScope
import dev.zacsweers.metro.Inject
import dev.zacsweers.metro.SingleIn
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import tachiyomi.domain.chapter.model.Chapter
import tachiyomi.domain.chapter.repository.ChapterRepository
import tachiyomi.domain.manga.model.Manga
import tachiyomi.domain.manga.repository.MangaRepository
import tachiyomi.source.local.io.LocalSourceFileSystem
import java.io.File
import java.util.Base64
import kotlin.time.Clock

@JvmInline
value class PageStackId(val value: Int)

data class PageStackItem(
    val id: Int,
    val fileName: String,
    val sourceTitle: String,
    val sourceChapter: String,
    val pageNumber: Int,
    val mangaId: Long,
    val sourceId: Long,
    val chapterId: Long,
    val chapterUrl: String,
)

/**
 * Thrown when a page that is already present in the stack (same chapter and page number)
 * is requested to be added again.
 */
class PageStackDuplicateChapterException(message: String) : Exception(message)

/**
 * Tracks which chapters currently have a page-stack write in flight, so the UI can show a
 * busy indicator scoped to the exact chapter/row involved instead of one global spinner.
 */
class PageStackChapterStateStore {
    private val _busyChapterIds = MutableStateFlow<Set<Long>>(emptySet())
    val busyChapterIds: StateFlow<Set<Long>> = _busyChapterIds.asStateFlow()

    fun start(chapterId: Long) {
        _busyChapterIds.update { it + chapterId }
    }

    fun finish(chapterId: Long) {
        _busyChapterIds.update { it - chapterId }
    }
}

@Inject
@SingleIn(AppScope::class)
class PageStackManager(
    private val context: Context,
    private val fileSystem: LocalSourceFileSystem,
    private val mangaRepository: MangaRepository,
    private val chapterRepository: ChapterRepository,
) {
    val chapterState = PageStackChapterStateStore()

    private val stackDir: UniFile?
        get() = context.filesDir.let { UniFile.fromFile(it) }?.createDirectory(STACK_DIRECTORY)

    private val indexFile: File
        get() = File(File(context.filesDir, STACK_DIRECTORY).apply { mkdirs() }, INDEX_FILE)

    private val _items = MutableStateFlow(loadItems())
    val items: StateFlow<List<PageStackItem>> = _items.asStateFlow()
    private val mutationMutex = Mutex()

    // Holds the most recently removed item (and its original position) until either a new
    // removal supersedes it or the caller undoes it; the underlying file is only deleted once
    // it can no longer be restored.
    private var pendingDeletion: Pair<Int, PageStackItem>? = null

    fun uriFor(item: PageStackItem): String = stackDir?.findFile(item.fileName)?.uri.toString()

    suspend fun addPage(
        stream: () -> java.io.InputStream,
        sourceTitle: String,
        sourceChapter: String,
        pageNumber: Int,
        mangaId: Long,
        sourceId: Long,
        chapterId: Long,
        chapterUrl: String,
    ) = withContext(Dispatchers.IO) {
        chapterState.start(chapterId)
        try {
            mutationMutex.withLock {
                val alreadyStacked = _items.value.any {
                    it.chapterId == chapterId && it.pageNumber == pageNumber
                }
                if (alreadyStacked) {
                    throw PageStackDuplicateChapterException(
                        "Page $pageNumber of this chapter is already in the page stack.",
                    )
                }
                val directory = stackDir ?: error("Unable to open page stack directory")
                val id = (_items.value.maxOfOrNull { it.id } ?: 0) + 1
                val fileName = "page_${id.toString().padStart(6, '0')}.jpg"
                directory.createFile(fileName)?.openOutputStream()?.use { output ->
                    stream().use { input -> input.copyTo(output) }
                } ?: error("Unable to save stacked page")
                val next = _items.value + PageStackItem(
                    id = id,
                    fileName = fileName,
                    sourceTitle = sourceTitle,
                    sourceChapter = sourceChapter,
                    pageNumber = pageNumber,
                    mangaId = mangaId,
                    sourceId = sourceId,
                    chapterId = chapterId,
                    chapterUrl = chapterUrl,
                )
                saveItems(next)
                _items.value = next
            }
        } finally {
            chapterState.finish(chapterId)
        }
    }

    suspend fun remove(id: Int) = withContext(Dispatchers.IO) {
        mutationMutex.withLock {
            val current = _items.value
            val index = current.indexOfFirst { it.id == id }
            if (index < 0) return@withLock
            val item = current[index]
            // A previous pending removal that was never undone is now permanent.
            pendingDeletion?.second?.let { stackDir?.findFile(it.fileName)?.delete() }
            pendingDeletion = index to item
            val next = current.filterNot { it.id == id }
            saveItems(next)
            _items.value = next
        }
    }

    /**
     * Restores the most recently removed item to its previous position, if it hasn't already
     * been superseded by a later removal. Returns false if there was nothing to undo.
     */
    suspend fun undoRemove(): Boolean = withContext(Dispatchers.IO) {
        mutationMutex.withLock {
            val (index, item) = pendingDeletion ?: return@withLock false
            pendingDeletion = null
            val current = _items.value
            val insertAt = index.coerceIn(0, current.size)
            val next = current.toMutableList().apply { add(insertAt, item) }
            saveItems(next)
            _items.value = next
            true
        }
    }

    suspend fun move(id: Int, offset: Int) = withContext(Dispatchers.IO) {
        mutationMutex.withLock {
            val index = _items.value.indexOfFirst { it.id == id }
            val target = index + offset
            if (index < 0 || target !in _items.value.indices) return@withLock
            val next = _items.value.toMutableList().apply { add(target, removeAt(index)) }
            saveItems(next)
            _items.value = next
        }
    }

    suspend fun clear() = withContext(Dispatchers.IO) {
        mutationMutex.withLock {
            pendingDeletion = null
            stackDir?.listFiles()?.forEach { it.delete() }
            saveItems(emptyList())
            _items.value = emptyList()
        }
    }

    private suspend fun removeExported(ids: Set<Int>) = withContext(Dispatchers.IO) {
        mutationMutex.withLock {
            val current = _items.value
            current.filter { it.id in ids }.forEach { stackDir?.findFile(it.fileName)?.delete() }
            val next = current.filterNot { it.id in ids }
            saveItems(next)
            _items.value = next
        }
    }

    suspend fun createLocalManga(title: String, chapterTitle: String, coverId: Int? = null): Manga = withContext(Dispatchers.IO) {
        require(_items.value.isNotEmpty()) { "The page stack is empty" }
        val localRoot = fileSystem.getBaseDirectory() ?: error("Local storage is not configured")
        val safeTitle = safeName(title)
        val workDirectoryName = uniqueDirectoryName(localRoot, safeTitle)
        val workDirectory = localRoot.createDirectory(workDirectoryName) ?: error("Unable to create local work")
        val safeChapter = safeName(chapterTitle.ifBlank { "Collected pages" })
        val chapterDirectory = workDirectory.createDirectory(safeChapter) ?: error("Unable to create local chapter")
        val ordered = _items.value
        ordered.forEachIndexed { index, item ->
            val source = stackDir?.findFile(item.fileName) ?: error("Missing stacked page")
            val target = chapterDirectory.createFile("${(index + 1).toString().padStart(6, '0')}.jpg")
                ?: error("Unable to create chapter page")
            source.openInputStream().use { input -> target.openOutputStream().use { output -> input.copyTo(output) } }
        }
        val coverItem = ordered.firstOrNull { it.id == coverId } ?: ordered.first()
        val coverSource = stackDir?.findFile(coverItem.fileName) ?: error("Missing cover page")
        val cover = workDirectory.createFile("cover.jpg") ?: error("Unable to create cover")
        coverSource.openInputStream().use { input -> cover.openOutputStream().use { output -> input.copyTo(output) } }

        val now = Clock.System.now()
        val inserted = mangaRepository.insertNetworkManga(
            listOf(
                Manga.create().copy(
                    source = 0L,
                    url = workDirectoryName,
                    title = title.trim(),
                    favoriteAt = now,
                    initialized = true,
                    thumbnailUrl = cover.uri.toString(),
                    lastUpdate = now,
                ),
            ),
        ).single()
        chapterRepository.updateFromRemote(
            removedIds = emptyList(),
            added = listOf(
                Chapter.create().copy(
                    mangaId = inserted.id,
                    url = "$workDirectoryName/$safeChapter",
                    name = chapterTitle.ifBlank { "Collected pages" },
                    chapterNumber = 1.0,
                    sourceOrder = 0L,
                    dateFetch = now,
                    dateUpload = now,
                ),
            ),
            updated = emptyList(),
        )
        // Remove only the pages that were included in this saved work (not undoable - their data
        // now lives in the saved work). Pages added while the copy was running must remain in the
        // user's current stack.
        removeExported(ordered.map { it.id }.toSet())
        inserted
    }

    private fun loadItems(): List<PageStackItem> = runCatching {
        AtomicFile(indexFile).openRead().bufferedReader().useLines { lines ->
            lines.mapNotNull { line ->
                val p = line.split('\t')
                if (p.size != 9) return@mapNotNull null
                PageStackItem(
                    id = p[0].toInt(),
                    fileName = p[1],
                    sourceTitle = decode(p[2]),
                    sourceChapter = decode(p[3]),
                    pageNumber = p[4].toInt(),
                    mangaId = p[5].toLong(),
                    sourceId = p[6].toLong(),
                    chapterId = p[7].toLong(),
                    chapterUrl = decode(p[8]),
                )
            }.toList()
        }
    }.getOrDefault(emptyList())

    private fun saveItems(items: List<PageStackItem>) {
        val atomicFile = AtomicFile(indexFile)
        val stream = atomicFile.startWrite()
        try {
            val writer = stream.bufferedWriter()
            items.forEach { item ->
                writer.appendLine(
                    listOf(
                        item.id,
                        item.fileName,
                        encode(item.sourceTitle),
                        encode(item.sourceChapter),
                        item.pageNumber,
                        item.mangaId,
                        item.sourceId,
                        item.chapterId,
                        encode(item.chapterUrl),
                    ).joinToString("\t"),
                )
            }
            writer.flush()
            atomicFile.finishWrite(stream)
        } catch (e: Exception) {
            atomicFile.failWrite(stream)
            throw e
        }
    }

    private fun uniqueDirectoryName(root: UniFile, base: String): String {
        var result = base
        var index = 2
        while (root.findFile(result)?.exists() == true) {
            result = "$base ($index)"
            index++
        }
        return result
    }

    private fun safeName(value: String): String = value.trim().replace(Regex("[\\\\/:*?\"<>|]"), "_").ifBlank { "Collected work" }
    private fun encode(value: String): String = Base64.getUrlEncoder().encodeToString(value.toByteArray())
    private fun decode(value: String): String = String(Base64.getUrlDecoder().decode(value))

    companion object {
        private const val STACK_DIRECTORY = "page_stack"
        private const val INDEX_FILE = "index.tsv"
    }
}
