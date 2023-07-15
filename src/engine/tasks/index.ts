import type { FunctionNode } from "../nodes/function";

export interface Task {
  id: string;
  name: string;
  next: string[];
  previous: string[];
  params?: {
    [key: string]: any;
  };
  exec?: FunctionNode;
  type: "FUNCTION" | "WAIT" | "START" | "END" | "LISTEN" | "CONDITION";
  status: "pending" | "completed";
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  global: {
    [key: string]: any;
  };
  tasks: Task[];
  status: "pending" | "completed";
}
