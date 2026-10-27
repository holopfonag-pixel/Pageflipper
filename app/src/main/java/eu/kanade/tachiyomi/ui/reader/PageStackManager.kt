package eu.kanade.tachiyomi.ui.reader

import android.content.Context
import com.hippo.unifile.UniFile
import dev.zacsweers.metro.AppScope
import dev.zacsweers.metro.Inject
import dev.zacsweers.metro.SingleIn
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import tachiyomi.domain.chapter.model.Chapter
import tachiyomi.domain.chapter.repository.ChapterRepository
import tachiyomi.domain.manga.model.Manga
import tachiyomi.domain.manga.repository.MangaRepository
import tachiyomi.source.local.io.LocalSourceFileSystem
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
)

@Inject
@SingleIn(AppScope::class)
class PageStackManager(
    private val context: Context,
    private val fileSystem: LocalSourceFileSystem,
    private val mangaRepository: MangaRepository,
    private val chapterRepository: ChapterRepository,
) {
    private val stackDir: UniFile?
        get() = context.filesDir.let { UniFile.fromFile(it) }?.createDirectory(STACK_DIRECTORY)

    private val _items = MutableStateFlow(loadItems())
    val items: StateFlow<List<PageStackItem>> = _items.asStateFlow()

    fun uriFor(item: PageStackItem): String = stackDir?.findFile(item.fileName)?.uri.toString()

    suspend fun addPage(
        stream: () -> java.io.InputStream,
        sourceTitle: String,
        sourceChapter: String,
        pageNumber: Int,
    ) = withContext(Dispatchers.IO) {
        val directory = stackDir ?: error("Unable to open page stack directory")
        val id = (_items.value.maxOfOrNull { it.id } ?: 0) + 1
        val fileName = "page_${id.toString().padStart(6, '0')}.jpg"
        directory.createFile(fileName)?.openOutputStream()?.use { output ->
            stream().use { input -> input.copyTo(output) }
        } ?: error("Unable to save stacked page")
        val next = _items.value + PageStackItem(id, fileName, sourceTitle, sourceChapter, pageNumber)
        saveItems(next)
        _items.value = next
    }

    suspend fun remove(id: Int) = withContext(Dispatchers.IO) {
        val current = _items.value
        current.firstOrNull { it.id == id }?.let { stackDir?.findFile(it.fileName)?.delete() }
        val next = current.filterNot { it.id == id }
        saveItems(next)
        _items.value = next
    }

    suspend fun move(id: Int, offset: Int) = withContext(Dispatchers.IO) {
        val index = _items.value.indexOfFirst { it.id == id }
        val target = index + offset
        if (index < 0 || target !in _items.value.indices) return@withContext
        val next = _items.value.toMutableList().apply { add(target, removeAt(index)) }
        saveItems(next)
        _items.value = next
    }

    suspend fun clear() = withContext(Dispatchers.IO) {
        stackDir?.listFiles()?.forEach { it.delete() }
        saveItems(emptyList())
        _items.value = emptyList()
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
        clear()
        inserted
    }

    private fun loadItems(): List<PageStackItem> {
        val file = stackDir?.findFile(INDEX_FILE) ?: return emptyList()
        return runCatching {
            file.openInputStream().bufferedReader().useLines { lines ->
                lines.mapNotNull { line ->
                    val p = line.split('\t')
                    if (p.size != 5) return@mapNotNull null
                    PageStackItem(p[0].toInt(), p[1], decode(p[2]), decode(p[3]), p[4].toInt())
                }.toList()
            }
        }.getOrDefault(emptyList())
    }

    private fun saveItems(items: List<PageStackItem>) {
        val directory = stackDir ?: return
        val file = directory.createFile(INDEX_FILE) ?: return
        file.openOutputStream().bufferedWriter().use { out ->
            items.forEach { item ->
                out.appendLine(listOf(item.id, item.fileName, encode(item.sourceTitle), encode(item.sourceChapter), item.pageNumber).joinToString("\t"))
            }
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
