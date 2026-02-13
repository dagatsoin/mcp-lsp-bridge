import { Todo, TodoStats, Priority } from '../models/types';

export function computeStats(todos: Todo[]): TodoStats {
  const byPriority: Record<Priority, number> = {
    [Priority.Low]: 0,
    [Priority.Medium]: 0,
    [Priority.High]: 0,
    [Priority.Critical]: 0,
  };

  let completed = 0;
  for (const todo of todos) {
    if (todo.done) completed++;
    byPriority[todo.priority]++;
  }

  return {
    total: todos.length,
    completed,
    pending: todos.length - completed,
    byPriority,
  };
}

export function getCompletionRate(todos: Todo[]): number {
  if (todos.length === 0) return 0;
  return todos.filter((t) => t.done).length / todos.length;
}

export function getOverdueTodos(todos: Todo[], daysOld: number): Todo[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  return todos.filter((todo) => !todo.done && todo.createdAt < cutoff);
}

export function getTodosByAssignee(todos: Todo[]): Map<string, Todo[]> {
  const groups = new Map<string, Todo[]>();
  for (const todo of todos) {
    const key = todo.assignee ?? 'unassigned';
    const list = groups.get(key) ?? [];
    list.push(todo);
    groups.set(key, list);
  }
  return groups;
}

export function getTodosByPriority(todos: Todo[]): Map<Priority, Todo[]> {
  const groups = new Map<Priority, Todo[]>();
  for (const todo of todos) {
    const list = groups.get(todo.priority) ?? [];
    list.push(todo);
    groups.set(todo.priority, list);
  }
  return groups;
}

export function getRecentlyUpdated(todos: Todo[], hours: number): Todo[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  return todos.filter((todo) => todo.updatedAt > cutoff);
}
