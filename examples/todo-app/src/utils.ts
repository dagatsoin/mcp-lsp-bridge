import { Todo } from './types';

export function formatTodo(todo: Todo): string {
  const status = todo.completed ? '[x]' : '[ ]';
  return `${status} ${todo.id}: ${todo.title}`;
}

export function formatTodoList(todos: Todo[]): string {
  if (todos.length === 0) return 'No todos found.';
  return todos.map(formatTodo).join('\n');
}

export function countCompleted(todos: Todo[]): number {
  return todos.filter((t) => t.completed).length;
}

export function countPending(todos: Todo[]): number {
  return todos.filter((t) => !t.completed).length;
}
