package eu.kanade.tachiyomi.ui.reader

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import kotlinx.coroutines.launch
import mihon.app.di.appGraph
import eu.kanade.presentation.util.Screen

class PageStackScreen : Screen() {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val context = LocalContext.current
        val manager = remember { context.applicationContext.appGraph.pageStackManager }
        val items by manager.items.collectAsState()
        val scope = rememberCoroutineScope()
        var showSaveDialog by remember { mutableStateOf(false) }
        var title by remember { mutableStateOf("") }
        var chapter by remember { mutableStateOf("Collected pages") }
        var coverId by remember { mutableStateOf<Int?>(null) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Page stack (${items.size})") },
                    navigationIcon = { IconButton(onClick = navigator::pop) { Text("‹") } },
                )
            },
        ) { padding ->
            Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (items.isEmpty()) {
                    Text("No pages in the stack yet.")
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        items(items, key = { it.id }) { item ->
                            Card(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    Text("[image]")
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("${item.id}. ${item.sourceTitle}")
                                        Text("${item.sourceChapter} · page ${item.pageNumber}")
                                    }
                                    Column {
                                        TextButton(onClick = { scope.launch { manager.move(item.id, -1) } }) { Text("↑") }
                                        TextButton(onClick = { scope.launch { manager.move(item.id, 1) } }) { Text("↓") }
                                    }
                                    TextButton(onClick = { scope.launch { manager.remove(item.id) } }) {
                                        Text("Remove")
                                    }
                                }
                            }
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { scope.launch { manager.clear() } }) { Text("Clear") }
                        Button(onClick = { showSaveDialog = true }, modifier = Modifier.weight(1f)) {
                            Text("Save as work")
                        }
                    }
                }
            }
        }

        if (showSaveDialog) {
            AlertDialog(
                onDismissRequest = { showSaveDialog = false },
                title = { Text("Save stack as local work") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Work name") })
                        OutlinedTextField(value = chapter, onValueChange = { chapter = it }, label = { Text("Chapter name") })
                        Text("Cover (first page by default)")
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            items.forEach { item ->
                                TextButton(onClick = { coverId = item.id }) {
                                    Text(if (coverId == item.id) "[${item.id}]" else item.id.toString())
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(enabled = title.isNotBlank(), onClick = {
                        scope.launch {
                            runCatching { manager.createLocalManga(title, chapter, coverId) }
                                .onSuccess { showSaveDialog = false; navigator.pop() }
                        }
                    }) { Text("Save") }
                },
                dismissButton = { TextButton(onClick = { showSaveDialog = false }) { Text("Cancel") } },
            )
        }
    }
}
