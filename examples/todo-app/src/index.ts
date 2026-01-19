import { addTodo, getTodos, updateTodo, deleteTodo } from './store';
import { formatTodoList, countCompleted, countPending } from './utils';

// Add some todos
addTodo({ title: 'Learn TypeScript', completed: true });
addTodo({ title: 'Build MCP server', completed: false });
addTodo({ title: 'Write tests', completed: false });

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
updateTodo(2, { completed: true });
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
