import { Todo, TodoEvent } from '../models/types';

type EventHandler = (event: TodoEvent) => void;

const handlers: EventHandler[] = [];
const eventLog: TodoEvent[] = [];

export function onTodoEvent(handler: EventHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
}

export function emitTodoCreated(todo: Todo): void {
  const event: TodoEvent = { type: 'created', todo, timestamp: new Date() };
  eventLog.push(event);
  handlers.forEach((h) => h(event));
}

export function emitTodoUpdated(todo: Todo): void {
  const event: TodoEvent = { type: 'updated', todo, timestamp: new Date() };
  eventLog.push(event);
  handlers.forEach((h) => h(event));
}

export function emitTodoDeleted(todo: Todo): void {
  const event: TodoEvent = { type: 'deleted', todo, timestamp: new Date() };
  eventLog.push(event);
  handlers.forEach((h) => h(event));
}

export function emitTodoCompleted(todo: Todo): void {
  const event: TodoEvent = { type: 'completed', todo, timestamp: new Date() };
  eventLog.push(event);
  handlers.forEach((h) => h(event));
}

export function getEventLog(): TodoEvent[] {
  return [...eventLog];
}

export function getEventsForTodo(todoId: number): TodoEvent[] {
  return eventLog.filter((e) => e.todo.id === todoId);
}

export function clearEventLog(): void {
  eventLog.length = 0;
}
