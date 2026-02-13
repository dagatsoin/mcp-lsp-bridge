export interface Todo {
  id: number;
  title: string;
  done: boolean;
  priority: Priority;
  tags: string[];
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface TodoFilter {
  completed?: boolean;
  search?: string;
  priority?: Priority;
  assignee?: string;
  tags?: string[];
}

export type TodoCreate = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>;
export type TodoUpdate = Partial<TodoCreate>;

export interface TodoEvent {
  type: 'created' | 'updated' | 'deleted' | 'completed';
  todo: Todo;
  timestamp: Date;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: Record<Priority, number>;
}

export interface TodoExport {
  todos: Todo[];
  exportedAt: Date;
  stats: TodoStats;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type PaginatedTodos = PaginatedResult<Todo>;
