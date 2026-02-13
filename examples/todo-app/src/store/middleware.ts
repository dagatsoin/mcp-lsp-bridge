import { Todo, TodoCreate, TodoUpdate } from '../models/types';
import { validateTodoCreate, validateTodoUpdate, validateTodo } from '../models/validators';
import { emitTodoCreated, emitTodoUpdated, emitTodoDeleted, emitTodoCompleted } from '../events/emitter';
import { addTodo, updateTodo, deleteTodo, getTodoById } from './store';

export function createTodoWithValidation(data: Partial<TodoCreate>): Todo {
  const validated = validateTodoCreate(data);
  const todo = addTodo(validated);

  if (!validateTodo(todo)) {
    throw new Error('Created todo failed validation');
  }

  emitTodoCreated(todo);
  return todo;
}

export function updateTodoWithValidation(
  id: number,
  data: TodoUpdate
): Todo | undefined {
  const validated = validateTodoUpdate(data);
  const todo = updateTodo(id, validated);

  if (!todo) return undefined;

  emitTodoUpdated(todo);

  if (data.done === true) {
    emitTodoCompleted(todo);
  }

  return todo;
}

export function deleteTodoWithEvents(id: number): boolean {
  const todo = getTodoById(id);
  if (!todo) return false;

  const deleted = deleteTodo(id);
  if (deleted) {
    emitTodoDeleted(todo);
  }

  return deleted;
}

export function completeTodo(id: number): Todo | undefined {
  const todo = getTodoById(id);
  if (!todo) return undefined;
  if (todo.done) return todo;

  return updateTodoWithValidation(id, { done: true });
}

export function reopenTodo(id: number): Todo | undefined {
  const todo = getTodoById(id);
  if (!todo) return undefined;
  if (!todo.done) return todo;

  return updateTodoWithValidation(id, { done: false });
}

export function batchComplete(ids: number[]): Todo[] {
  const completed: Todo[] = [];
  for (const id of ids) {
    const todo = completeTodo(id);
    if (todo) completed.push(todo);
  }
  return completed;
}

export function batchDelete(ids: number[]): number {
  let count = 0;
  for (const id of ids) {
    if (deleteTodoWithEvents(id)) count++;
  }
  return count;
}
