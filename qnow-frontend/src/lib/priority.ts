import type { Priority } from '../api/types';

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export const priorityLabel: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
