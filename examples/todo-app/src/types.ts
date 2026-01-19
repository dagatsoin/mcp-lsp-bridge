export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface TodoFilter {
  completed?: boolean;
  search?: string;
}

export type TodoCreate = Omit<Todo, 'id' | 'createdAt'>;
