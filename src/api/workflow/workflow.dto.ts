import { z } from "zod";

export const StartWorkflowBody = z.object({
  workflowDefinitionId: z
    .string({
      required_error: "Workflow Definition Id is required",
    })
    .min(1, {
      message: "Workflow Definition Id is required",
    }),
  globalParams: z.any().optional(),
});
export type StartWorkflowBody = z.infer<typeof StartWorkflowBody>;

export const ProcessWorkflowBody = z.object({
  workflowRuntimeId: z
    .string({
      required_error: "Workflow Runtime Id is required",
    })
    .min(1, {
      message: "Workflow Runtime Id is required",
    }),
  taskName: z
    .string({
      required_error: "Task Name is required",
    })
    .min(1, {
      message: "Task Name is required",
    }),
});
export type ProcessWorkflowBody = z.infer<typeof ProcessWorkflowBody>;
