import { Todo, PaginatedResult } from '../models/types';

export function paginateTodos(
  todos: Todo[],
  page: number,
  pageSize: number
): PaginatedResult<Todo> {
  const start = (page - 1) * pageSize;
  const items = todos.slice(start, start + pageSize);

  return {
    items,
    total: todos.length,
    page,
    pageSize,
    hasMore: start + pageSize < todos.length,
  };
}

export function getAllPages(todos: Todo[], pageSize: number): Array<PaginatedResult<Todo>> {
  const pages: Array<PaginatedResult<Todo>> = [];
  const totalPages = Math.ceil(todos.length / pageSize);

  for (let page = 1; page <= totalPages; page++) {
    pages.push(paginateTodos(todos, page, pageSize));
  }

  return pages;
}

export function getPageCount(todos: Todo[], pageSize: number): number {
  return Math.ceil(todos.length / pageSize);
}
