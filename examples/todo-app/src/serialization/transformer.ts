import { Todo, Priority } from '../models/types';

export function cloneTodo(todo: Todo): Todo {
  return {
    ...todo,
    tags: [...todo.tags],
    createdAt: new Date(todo.createdAt),
    updatedAt: new Date(todo.updatedAt),
  };
}

export function mergeTodos(base: Todo, overrides: Partial<Todo>): Todo {
  return {
    ...base,
    ...overrides,
    tags: overrides.tags ?? [...base.tags],
    createdAt: base.createdAt,
    updatedAt: new Date(),
  };
}

export function todoToMap(todo: Todo): Map<string, unknown> {
  const map = new Map<string, unknown>();
  map.set('id', todo.id);
  map.set('title', todo.title);
  map.set('done', todo.done);
  map.set('priority', todo.priority);
  map.set('tags', todo.tags);
  map.set('assignee', todo.assignee);
  map.set('createdAt', todo.createdAt);
  map.set('updatedAt', todo.updatedAt);
  return map;
}

export function pickTodoFields<K extends keyof Todo>(
  todo: Todo,
  fields: K[]
): Pick<Todo, K> {
  const result = {} as Pick<Todo, K>;
  for (const field of fields) {
    result[field] = todo[field];
  }
  return result;
}

export function omitTodoFields<K extends keyof Todo>(
  todo: Todo,
  fields: K[]
): Omit<Todo, K> {
  const result = { ...todo } as Record<string, unknown>;
  for (const field of fields) {
    delete result[field as string];
  }
  return result as Omit<Todo, K>;
}

export function upgradePriority(todo: Todo): Todo {
  const order: Priority[] = [Priority.Low, Priority.Medium, Priority.High, Priority.Critical];
  const currentIndex = order.indexOf(todo.priority);
  const newPriority = currentIndex < order.length - 1 ? order[currentIndex + 1] : todo.priority;

  return { ...todo, priority: newPriority, updatedAt: new Date() };
}

export function downgradePriority(todo: Todo): Todo {
  const order: Priority[] = [Priority.Low, Priority.Medium, Priority.High, Priority.Critical];
  const currentIndex = order.indexOf(todo.priority);
  const newPriority = currentIndex > 0 ? order[currentIndex - 1] : todo.priority;

  return { ...todo, priority: newPriority, updatedAt: new Date() };
}
