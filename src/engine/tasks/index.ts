import type { FunctionNode } from '../nodes/function';

export const TaskStatus = {
  pending: 'pending',
  completed: 'completed',
  started: 'started',
  failed: 'failed',
} as const;

export type TaskStatusType = keyof typeof TaskStatus;
export const TaskStatusEnum = Object.keys(TaskStatus);

export const TaskType = {
  FUNCTION: 'FUNCTION',
  WAIT: 'WAIT',
  START: 'START',
  END: 'END',
  LISTEN: 'LISTEN',
  GUARD: 'GUARD',
} as const;

export type TaskTypeType = keyof typeof TaskType;
export const TaskTypeEnum = Object.keys(TaskType);

export interface Task {
  id: string;
  name: string;
  next: string[];
  previous: string[];
  params?: Record<string, any | any[]>;
  exec?: FunctionNode;
  type: TaskTypeType;
  status: TaskStatusType;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  global: Record<string, any>;
  tasks: Task[];
  status: 'pending' | 'completed' | 'failed';
}
