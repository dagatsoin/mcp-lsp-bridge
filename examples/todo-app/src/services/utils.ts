import { Todo, Priority } from '../models/types';

export function formatTodo(todo: Todo): string {
  const status = todo.done ? '[x]' : '[ ]';
  return `${status} ${todo.id}: ${todo.title} (${todo.priority})`;
}

export function formatTodoList(todos: Todo[]): string {
  if (todos.length === 0) return 'No todos found.';
  return todos.map(formatTodo).join('\n');
}

export function countCompleted(todos: Todo[]): number {
  return todos.filter((t) => t.done).length;
}

export function countPending(todos: Todo[]): number {
  return todos.filter((t) => !t.done).length;
}

export function countByPriority(todos: Todo[], priority: Priority): number {
  return todos.filter((t) => t.priority === priority).length;
}

export function getUniqueTags(todos: Todo[]): string[] {
  const tags = new Set<string>();
  for (const todo of todos) {
    for (const tag of todo.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function getUniqueAssignees(todos: Todo[]): string[] {
  const assignees = new Set<string>();
  for (const todo of todos) {
    if (todo.assignee) assignees.add(todo.assignee);
  }
  return [...assignees].sort();
}
