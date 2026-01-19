import { Todo, TodoCreate, TodoFilter } from './types';

let nextId = 1;
const todos: Todo[] = [];

export function addTodo(data: TodoCreate): Todo {
  const todo: Todo = {
    id: nextId++,
    title: data.title,
    completed: data.completed,
    createdAt: new Date(),
  };
  todos.push(todo);
  return todo;
}

export function getTodos(filter?: TodoFilter): Todo[] {
  let result = [...todos];

  if (filter?.completed !== undefined) {
    result = result.filter((t) => t.completed === filter.completed);
  }

  if (filter?.search) {
    const search = filter.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(search));
  }

  return result;
}

export function getTodoById(id: number): Todo | undefined {
  return todos.find((t) => t.id === id);
}

export function updateTodo(id: number, updates: Partial<TodoCreate>): Todo | undefined {
  const todo = getTodoById(id);
  if (!todo) return undefined;

  if (updates.title !== undefined) todo.title = updates.title;
  if (updates.completed !== undefined) todo.completed = updates.completed;

  return todo;
}

export function deleteTodo(id: number): boolean {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}
