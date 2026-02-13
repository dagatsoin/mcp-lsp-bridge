import { Todo, TodoExport, TodoStats, Priority } from '../models/types';

export function todoToJSON(todo: Todo): Record<string, unknown> {
  return {
    id: todo.id,
    title: todo.title,
    done: todo.done,
    priority: todo.priority,
    tags: todo.tags,
    assignee: todo.assignee ?? null,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}

export function todoFromJSON(data: Record<string, unknown>): Todo {
  return {
    id: data.id as number,
    title: data.title as string,
    done: data.done as boolean,
    priority: data.priority as Priority,
    tags: (data.tags as string[]) ?? [],
    assignee: data.assignee as string | undefined,
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
  };
}

export function todosToCSV(todos: Todo[]): string {
  const header = 'id,title,done,priority,tags,assignee,createdAt,updatedAt';
  const rows = todos.map((todo) =>
    [
      todo.id,
      `"${todo.title.replace(/"/g, '""')}"`,
      todo.done,
      todo.priority,
      `"${todo.tags.join(';')}"`,
      todo.assignee ?? '',
      todo.createdAt.toISOString(),
      todo.updatedAt.toISOString(),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function exportTodos(todos: Todo[], stats: TodoStats): TodoExport {
  return {
    todos: todos.map((todo) => ({ ...todo })),
    exportedAt: new Date(),
    stats,
  };
}

export function importTodos(data: string): Todo[] {
  const parsed = JSON.parse(data) as TodoExport;
  return parsed.todos.map((todo) => ({
    ...todo,
    createdAt: new Date(todo.createdAt),
    updatedAt: new Date(todo.updatedAt),
  }));
}
