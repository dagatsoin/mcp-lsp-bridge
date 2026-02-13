import { addTodo, getTodos, updateTodo, deleteTodo } from './store';
import { formatTodoList, countCompleted, countPending } from './utils';

// Add some todos
addTodo({ title: 'Learn TypeScript', done: true });
addTodo({ title: 'Build MCP server', done: false });
addTodo({ title: 'Write tests', done: false });

// Display all todos
console.log('All Todos:');
console.log(formatTodoList(getTodos()));
console.log();

// Show stats
const all = getTodos();
console.log(`Completed: ${countCompleted(all)}`);
console.log(`Pending: ${countPending(all)}`);
console.log();

// Update a todo
updateTodo(2, { done: true });
console.log('After completing "Build MCP server":');
console.log(formatTodoList(getTodos()));
console.log();

// Filter completed
console.log('Completed only:');
console.log(formatTodoList(getTodos({ completed: true })));

// Delete a todo
deleteTodo(1);
console.log('\nAfter deleting first todo:');
console.log(formatTodoList(getTodos()));
