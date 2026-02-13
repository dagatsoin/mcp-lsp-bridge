import { Todo, TodoCreate, TodoUpdate, Priority } from './types';

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateTodoCreate(data: Partial<TodoCreate>): TodoCreate {
  if (!data.title || data.title.trim().length === 0) {
    throw new ValidationError('title', 'Title is required');
  }

  if (data.title.length > 200) {
    throw new ValidationError('title', 'Title must be under 200 characters');
  }

  if (data.done === undefined) {
    throw new ValidationError('done', 'Done status is required');
  }

  if (data.priority && !Object.values(Priority).includes(data.priority)) {
    throw new ValidationError('priority', 'Invalid priority value');
  }

  return {
    title: data.title.trim(),
    done: data.done,
    priority: data.priority ?? Priority.Medium,
    tags: data.tags ?? [],
    assignee: data.assignee,
  };
}

export function validateTodoUpdate(data: TodoUpdate): TodoUpdate {
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      throw new ValidationError('title', 'Title cannot be empty');
    }
    if (data.title.length > 200) {
      throw new ValidationError('title', 'Title must be under 200 characters');
    }
  }

  return data;
}

export function validateTodo(todo: Todo): boolean {
  return (
    typeof todo.id === 'number' &&
    typeof todo.title === 'string' &&
    todo.title.length > 0 &&
    typeof todo.done === 'boolean' &&
    Object.values(Priority).includes(todo.priority) &&
    Array.isArray(todo.tags) &&
    todo.createdAt instanceof Date &&
    todo.updatedAt instanceof Date
  );
}
