import { Todo, TodoStats, Priority, TodoExport } from '../models/types';

const PRIORITY_ICONS: Record<Priority, string> = {
  [Priority.Low]: ' ',
  [Priority.Medium]: '!',
  [Priority.High]: '!!',
  [Priority.Critical]: '!!!',
};

export function formatTodo(todo: Todo): string {
  const status = todo.done ? '[x]' : '[ ]';
  const priority = PRIORITY_ICONS[todo.priority];
  const tags = todo.tags.length > 0 ? ` [${todo.tags.join(', ')}]` : '';
  const assignee = todo.assignee ? ` @${todo.assignee}` : '';
  return `${status} ${priority} #${todo.id}: ${todo.title}${tags}${assignee}`;
}

export function formatTodoList(todos: Todo[]): string {
  if (todos.length === 0) return 'No todos found.';
  return todos.map(formatTodo).join('\n');
}

export function formatTodoDetailed(todo: Todo): string {
  const lines = [
    `Todo #${todo.id}`,
    `  Title:    ${todo.title}`,
    `  Status:   ${todo.done ? 'Done' : 'Pending'}`,
    `  Priority: ${todo.priority}`,
    `  Tags:     ${todo.tags.length > 0 ? todo.tags.join(', ') : 'none'}`,
    `  Assignee: ${todo.assignee ?? 'unassigned'}`,
    `  Created:  ${todo.createdAt.toISOString()}`,
    `  Updated:  ${todo.updatedAt.toISOString()}`,
  ];
  return lines.join('\n');
}

export function formatStats(stats: TodoStats): string {
  const lines = [
    `Total: ${stats.total}`,
    `Completed: ${stats.completed}`,
    `Pending: ${stats.pending}`,
    `By Priority:`,
    ...Object.entries(stats.byPriority).map(
      ([priority, count]) => `  ${priority}: ${count}`
    ),
  ];
  return lines.join('\n');
}

export function formatTodoTable(todos: Todo[]): string {
  if (todos.length === 0) return 'No todos.';

  const header = '| ID | Status | Priority | Title | Tags | Assignee |';
  const sep = '|----|--------|----------|-------|------|----------|';
  const rows = todos.map(
    (todo) =>
      `| ${todo.id} | ${todo.done ? 'Done' : 'Pending'} | ${todo.priority} | ${todo.title} | ${todo.tags.join(', ')} | ${todo.assignee ?? '-'} |`
  );

  return [header, sep, ...rows].join('\n');
}

export function formatExportSummary(data: TodoExport): string {
  return [
    `Export Summary`,
    `  Exported at: ${data.exportedAt.toISOString()}`,
    `  Total todos: ${data.todos.length}`,
    `  Stats: ${data.stats.completed} done, ${data.stats.pending} pending`,
  ].join('\n');
}
