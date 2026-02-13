import { Todo } from '../models/types';
import { cloneTodo } from '../serialization/transformer';
import { diffTodos, TodoDiff } from './differ';

interface HistoryEntry {
  todoId: number;
  snapshot: Todo;
  diffs: TodoDiff[];
  timestamp: Date;
}

const history: HistoryEntry[] = [];

export function recordSnapshot(todo: Todo): void {
  const existing = getLatestSnapshot(todo.id);
  const diffs = existing ? diffTodos(existing, todo) : [];

  history.push({
    todoId: todo.id,
    snapshot: cloneTodo(todo),
    diffs,
    timestamp: new Date(),
  });
}

export function getLatestSnapshot(todoId: number): Todo | undefined {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].todoId === todoId) {
      return cloneTodo(history[i].snapshot);
    }
  }
  return undefined;
}

export function getHistory(todoId: number): HistoryEntry[] {
  return history
    .filter((entry) => entry.todoId === todoId)
    .map((entry) => ({
      ...entry,
      snapshot: cloneTodo(entry.snapshot),
    }));
}

export function getSnapshotAt(todoId: number, date: Date): Todo | undefined {
  let result: Todo | undefined;
  for (const entry of history) {
    if (entry.todoId === todoId && entry.timestamp <= date) {
      result = cloneTodo(entry.snapshot);
    }
  }
  return result;
}

export function clearHistory(): void {
  history.length = 0;
}

export function getHistorySize(): number {
  return history.length;
}
