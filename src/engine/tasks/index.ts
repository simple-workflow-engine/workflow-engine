import type { FunctionNode } from '../nodes/function';

export enum TaskStatus {
  pending = 'pending',
  completed = 'completed',
  started = 'started',
  failed = 'failed',
}

export enum TaskType {
  'FUNCTION' = 'FUNCTION',
  'WAIT' = 'WAIT',
  'START' = 'START',
  'END' = 'END',
  'LISTEN' = 'LISTEN',
  'GUARD' = 'GUARD',
}

export interface Task {
  id: string;
  name: string;
  next: string[];
  previous: string[];
  params?: Record<string, any | any[]>;
  exec?: FunctionNode;
  type: TaskType;
  status: TaskStatus;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  global: Record<string, any>;
  tasks: Task[];
  status: 'pending' | 'completed' | 'failed';
}
