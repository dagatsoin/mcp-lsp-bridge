import { Todo, TodoCreate, TodoUpdate, TodoFilter, Priority } from '../models/types';

let nextId = 1;
const todos: Todo[] = [];

export function addTodo(data: TodoCreate): Todo {
  const now = new Date();
  const todo: Todo = {
    id: nextId++,
    title: data.title,
    done: data.done,
    priority: data.priority,
    tags: data.tags ?? [],
    assignee: data.assignee,
    createdAt: now,
    updatedAt: now,
  };
  todos.push(todo);
  return todo;
}

export function getTodos(filter?: TodoFilter): Todo[] {
  let result = [...todos];

  if (filter?.completed !== undefined) {
    result = result.filter((t) => t.done === filter.completed);
  }

  if (filter?.priority !== undefined) {
    result = result.filter((t) => t.priority === filter.priority);
  }

  if (filter?.assignee !== undefined) {
    result = result.filter((t) => t.assignee === filter.assignee);
  }

  if (filter?.search) {
    const search = filter.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(search));
  }

  if (filter?.tags && filter.tags.length > 0) {
    result = result.filter((t) =>
      filter.tags!.some((tag) => t.tags.includes(tag))
    );
  }

  return result;
}

export function getTodoById(id: number): Todo | undefined {
  return todos.find((t) => t.id === id);
}

export function updateTodo(id: number, updates: TodoUpdate): Todo | undefined {
  const todo = getTodoById(id);
  if (!todo) return undefined;

  if (updates.title !== undefined) todo.title = updates.title;
  if (updates.done !== undefined) todo.done = updates.done;
  if (updates.priority !== undefined) todo.priority = updates.priority;
  if (updates.tags !== undefined) todo.tags = updates.tags;
  if (updates.assignee !== undefined) todo.assignee = updates.assignee;
  todo.updatedAt = new Date();

  return todo;
}

export function deleteTodo(id: number): boolean {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}

export function getAllTodos(): Todo[] {
  return [...todos];
}

export function clearTodos(): void {
  todos.length = 0;
  nextId = 1;
}
