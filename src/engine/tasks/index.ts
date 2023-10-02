import type { FunctionNode } from '../nodes/function';

export const TaskStatus = {
  pending: 'pending',
  completed: 'completed',
  started: 'started',
  failed: 'failed',
} as const;

export interface Task {
  id: string;
  name: string;
  next: string[];
  previous: string[];
  params?: {
    [key: string]: any | any[];
  };
  exec?: FunctionNode;
  type: 'FUNCTION' | 'WAIT' | 'START' | 'END' | 'LISTEN' | 'GUARD';
  status: keyof typeof TaskStatus;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  global: {
    [key: string]: any;
  };
  tasks: Task[];
  status: 'pending' | 'completed' | 'failed';
}
