import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

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
      enum: ["pending", "completed", "failed"],
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
    workflowDefinitionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "WorkflowDefinition",
    },
  },
  {
    timestamps: true,
  }
);

export const WorkflowRuntime = model("WorkflowRuntime", schema);

export type WorkflowRuntimeDocument = InferSchemaType<typeof schema>;
