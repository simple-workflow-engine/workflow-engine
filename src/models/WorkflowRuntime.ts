import { Schema, model } from "mongoose";
import type { HydratedDocumentFromSchema } from "mongoose";

const schema = new Schema(
  {
    workflowResults: {
      type: Object,
      required: false,
      default: {},
    },
    global: {
      type: Object,
      required: false,
      default: {},
    },
    workflowStatus: {
      type: String,
      required: false,
      enum: ["pending", "completed"],
      default: "pending",
    },
    tasks: {
      type: Array,
      required: true,
      default: [],
    },
    logs: {
      type: Array,
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const WorkflowRuntime = model("WorkflowRuntime", schema);

export type WorkflowRuntimeDocument = HydratedDocumentFromSchema<typeof schema>;
