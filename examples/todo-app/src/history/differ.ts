import { Todo } from '../models/types';

export interface TodoDiff {
  field: keyof Todo;
  before: unknown;
  after: unknown;
}

export function diffTodos(before: Todo, after: Todo): TodoDiff[] {
  const diffs: TodoDiff[] = [];
  const fields: Array<keyof Todo> = [
    'title',
    'done',
    'priority',
    'assignee',
  ];

  for (const field of fields) {
    if (before[field] !== after[field]) {
      diffs.push({ field, before: before[field], after: after[field] });
    }
  }

  // Compare tags arrays
  const beforeTags = JSON.stringify(before.tags);
  const afterTags = JSON.stringify(after.tags);
  if (beforeTags !== afterTags) {
    diffs.push({ field: 'tags', before: before.tags, after: after.tags });
  }

  return diffs;
}

export function hasTodoChanged(before: Todo, after: Todo): boolean {
  return diffTodos(before, after).length > 0;
}

export function formatDiff(diffs: TodoDiff[]): string {
  if (diffs.length === 0) return 'No changes';
  return diffs
    .map((d) => `  ${String(d.field)}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`)
    .join('\n');
}

export function applyDiff(todo: Todo, diffs: TodoDiff[]): Todo {
  const updated = { ...todo, tags: [...todo.tags] };
  for (const diff of diffs) {
    (updated as Record<string, unknown>)[diff.field as string] = diff.after;
  }
  updated.updatedAt = new Date();
  return updated;
}
