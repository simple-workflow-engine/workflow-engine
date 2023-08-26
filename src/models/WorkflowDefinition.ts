import type { InferSchemaType } from "mongoose";
import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tasks: {
      type: Array,
      required: true,
      default: [],
    },
    global: {
      type: Object,
      required: false,
      default: {},
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
    uiObject: {
      type: Object,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const WorkflowDefinition = model("WorkflowDefinition", schema);

export type WorkflowDefinitionDocument = InferSchemaType<typeof schema>;
