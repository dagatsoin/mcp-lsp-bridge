import { Todo, Priority } from '../models/types';

export interface SearchOptions {
  query: string;
  fields?: Array<'title' | 'tags' | 'assignee'>;
  caseSensitive?: boolean;
  matchAll?: boolean;
}

export function searchTodos(todos: Todo[], options: SearchOptions): Todo[] {
  const { query, fields = ['title'], caseSensitive = false, matchAll = false } = options;
  const terms = query.split(/\s+/).filter(Boolean);

  if (terms.length === 0) return todos;

  return todos.filter((todo) => {
    const matchFn = matchAll ? terms.every.bind(terms) : terms.some.bind(terms);

    return matchFn((term) => {
      const searchTerm = caseSensitive ? term : term.toLowerCase();

      return fields.some((field) => {
        switch (field) {
          case 'title': {
            const title = caseSensitive ? todo.title : todo.title.toLowerCase();
            return title.includes(searchTerm);
          }
          case 'tags':
            return todo.tags.some((tag) => {
              const t = caseSensitive ? tag : tag.toLowerCase();
              return t.includes(searchTerm);
            });
          case 'assignee': {
            if (!todo.assignee) return false;
            const assignee = caseSensitive ? todo.assignee : todo.assignee.toLowerCase();
            return assignee.includes(searchTerm);
          }
          default:
            return false;
        }
      });
    });
  });
}

export function filterByPriority(todos: Todo[], priorities: Priority[]): Todo[] {
  return todos.filter((todo) => priorities.includes(todo.priority));
}

export function filterByTags(todos: Todo[], tags: string[], matchAll = false): Todo[] {
  return todos.filter((todo) => {
    if (matchAll) {
      return tags.every((tag) => todo.tags.includes(tag));
    }
    return tags.some((tag) => todo.tags.includes(tag));
  });
}

export function filterByDateRange(
  todos: Todo[],
  field: 'createdAt' | 'updatedAt',
  start?: Date,
  end?: Date
): Todo[] {
  return todos.filter((todo) => {
    const date = todo[field];
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}
