import { Priority } from './models/types';
import { addTodo, getTodos, updateTodo, deleteTodo, getAllTodos } from './store/store';
import { formatTodoList, countCompleted, countPending } from './services/utils';
import { computeStats } from './services/stats';
import { formatStats, formatTodoTable, formatTodoDetailed } from './serialization/formatter';
import { searchTodos } from './query/search';
import { sortTodos } from './query/sorter';
import { paginateTodos } from './query/paginator';
import { createTodoWithValidation, completeTodo } from './store/middleware';
import { onTodoEvent } from './events/emitter';
import { todoToJSON, todosToCSV, exportTodos } from './serialization/json';
import { recordSnapshot } from './history/tracker';

// Listen for events
onTodoEvent((event) => {
  console.log(`[Event] ${event.type}: Todo #${event.todo.id} - ${event.todo.title}`);
  recordSnapshot(event.todo);
});

// Create todos via middleware (with validation & events)
createTodoWithValidation({ title: 'Learn TypeScript', done: true, priority: Priority.High, tags: ['learning', 'dev'] });
createTodoWithValidation({ title: 'Build MCP server', done: false, priority: Priority.Critical, tags: ['dev', 'mcp'], assignee: 'alice' });
createTodoWithValidation({ title: 'Write tests', done: false, priority: Priority.High, tags: ['dev', 'testing'], assignee: 'bob' });
createTodoWithValidation({ title: 'Update docs', done: false, priority: Priority.Medium, tags: ['docs'] });
createTodoWithValidation({ title: 'Fix linting', done: true, priority: Priority.Low, tags: ['dev', 'cleanup'], assignee: 'alice' });
createTodoWithValidation({ title: 'Deploy to prod', done: false, priority: Priority.Critical, tags: ['ops', 'deploy'], assignee: 'charlie' });
createTodoWithValidation({ title: 'Review PRs', done: false, priority: Priority.Medium, tags: ['dev', 'review'], assignee: 'bob' });
createTodoWithValidation({ title: 'Team standup notes', done: true, priority: Priority.Low, tags: ['meeting'] });

console.log('\n=== All Todos ===');
console.log(formatTodoList(getAllTodos()));

console.log('\n=== Table View ===');
console.log(formatTodoTable(getAllTodos()));

console.log('\n=== Stats ===');
const stats = computeStats(getAllTodos());
console.log(formatStats(stats));

console.log('\n=== Search: "mcp" ===');
const results = searchTodos(getAllTodos(), { query: 'mcp', fields: ['title', 'tags'] });
console.log(formatTodoList(results));

console.log('\n=== Sorted by Priority ===');
const sorted = sortTodos(getAllTodos(), 'priority');
console.log(formatTodoList(sorted));

console.log('\n=== Page 1 (3 per page) ===');
const page = paginateTodos(getAllTodos(), 1, 3);
console.log(formatTodoList(page.items));
console.log(`(Page ${page.page}, ${page.total} total, hasMore: ${page.hasMore})`);

// Complete a todo
console.log('\n=== Completing "Build MCP server" ===');
completeTodo(2);

// Detailed view
console.log('\n=== Detailed View ===');
const todo = getTodos({ search: 'Build' })[0];
if (todo) console.log(formatTodoDetailed(todo));

// Export
console.log('\n=== JSON Export (first todo) ===');
const first = getAllTodos()[0];
if (first) console.log(JSON.stringify(todoToJSON(first), null, 2));

console.log('\n=== CSV Export ===');
console.log(todosToCSV(getAllTodos()));

console.log('\n=== Export Summary ===');
const exportData = exportTodos(getAllTodos(), computeStats(getAllTodos()));
console.log(`Exported ${exportData.todos.length} todos at ${exportData.exportedAt.toISOString()}`);
