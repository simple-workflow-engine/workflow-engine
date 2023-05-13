import type { FunctionNode } from "../nodes/function";

export interface Task {
  name: string;
  id: string;
  next: string[];
  previous: string[];
  params?: {
    [key: string]: any;
  };
  exec?: FunctionNode;
  type: "FUNCTION" | "WAIT" | "START" | "END" | "LISTEN";
  status: "pending" | "completed";
}

export interface Workflow {
  name: string;
  id: string;
  description: string;
  global: {
    [key: string]: any;
  };
  tasks: Task[];
  status: "pending" | "completed";
}
