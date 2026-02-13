import { Todo, Priority } from '../models/types';

const priorityOrder: Record<Priority, number> = {
  [Priority.Critical]: 0,
  [Priority.High]: 1,
  [Priority.Medium]: 2,
  [Priority.Low]: 3,
};

export type SortField = 'title' | 'priority' | 'createdAt' | 'updatedAt' | 'done';
export type SortDirection = 'asc' | 'desc';

export function sortTodos(
  todos: Todo[],
  field: SortField,
  direction: SortDirection = 'asc'
): Todo[] {
  const sorted = [...todos].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'priority':
        cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'createdAt':
        cmp = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'updatedAt':
        cmp = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'done':
        cmp = Number(a.done) - Number(b.done);
        break;
    }
    return direction === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

export function sortByMultiple(
  todos: Todo[],
  criteria: Array<{ field: SortField; direction: SortDirection }>
): Todo[] {
  return [...todos].sort((a, b) => {
    for (const { field, direction } of criteria) {
      let cmp = 0;
      switch (field) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'priority':
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'createdAt':
          cmp = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          cmp = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'done':
          cmp = Number(a.done) - Number(b.done);
          break;
      }
      if (cmp !== 0) return direction === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
}

export function groupByDone(todos: Todo[]): { done: Todo[]; pending: Todo[] } {
  return {
    done: todos.filter((t) => t.done),
    pending: todos.filter((t) => !t.done),
  };
}
