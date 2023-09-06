import { z } from "zod";

export const AddWorkflowBody = z.object({
  workflowData: z.object({
    name: z
      .string({
        required_error: "Workflow Definition Name is required",
      })
      .min(1, "Workflow Definition Name is required"),
    description: z
      .string({
        required_error: "Workflow Definition Description is required",
      })
      .min(1, "Workflow Definition Description is required"),
    global: z.record(
      z
        .string({
          required_error: "Key name is required",
        })
        .min(1, "Key name is required"),
      z.any()
    ),
    status: z.enum(["active", "inactive"]),
    tasks: z.array(
      z.object({
        id: z
          .string({
            required_error: "Task Id is required",
          })
          .min(1, "Task Id is required"),
        name: z
          .string({
            required_error: "Task Name is required",
          })
          .min(1, "Task Name is required"),
        type: z.enum(["FUNCTION", "WAIT", "START", "END", "LISTEN", "GUARD"]),
        next: z.array(z.string({ required_error: "Task name is required" }).min(1, "Task name is required")),
        previous: z.array(z.string({ required_error: "Task name is required" }).min(1, "Task name is required")),
      })
    ),
  }),
  key: z
    .string({
      required_error: "Key name is required",
    })
    .min(1, "Key name is required"),
  ui: z.any(),
});

export type AddWorkflowBody = z.infer<typeof AddWorkflowBody>;

export const EditWorkflowBody = z.object({
  workflowData: z.object({
    name: z
      .string({
        required_error: "Workflow Definition Name is required",
      })
      .min(1, "Workflow Definition Name is required"),
    description: z
      .string({
        required_error: "Workflow Definition Description is required",
      })
      .min(1, "Workflow Definition Description is required"),
    global: z.record(
      z
        .string({
          required_error: "Key name is required",
        })
        .min(1, "Key name is required"),
      z.any()
    ),
    status: z.enum(["active", "inactive"]),
    tasks: z.array(
      z.object({
        id: z
          .string({
            required_error: "Task Id is required",
          })
          .min(1, "Task Id is required"),
        name: z
          .string({
            required_error: "Task Name is required",
          })
          .min(1, "Task Name is required"),
        type: z.enum(["FUNCTION", "WAIT", "START", "END", "LISTEN", "GUARD"]),
        next: z.array(z.string({ required_error: "Task name is required" }).min(1, "Task name is required")),
        previous: z.array(z.string({ required_error: "Task name is required" }).min(1, "Task name is required")),
      })
    ),
  }),
  key: z
    .string({
      required_error: "Key name is required",
    })
    .min(1, "Key name is required"),
  ui: z.any(),
});

export type EditWorkflowBody = z.infer<typeof EditWorkflowBody>;
