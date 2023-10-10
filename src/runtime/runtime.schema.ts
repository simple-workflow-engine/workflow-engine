import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Definition } from '../definition/definition.schema';
import { LogObject } from '@/engine/logger';

export enum RuntimeStatus {
  'pending' = 'pending',
  'completed' = 'completed',
  'failed' = 'failed',
}

@Schema({
  timestamps: true,
})
export class Runtime {
  @Prop({
    type: Object,
    default: {},
    required: false,
  })
  workflowResults?: Record<string, any>;

  @Prop({
    type: Object,
    default: {},
    required: false,
  })
  global?: Record<string, any>;

  @Prop({
    type: String,
    required: false,
    enum: RuntimeStatus,
    default: RuntimeStatus.pending,
  })
  workflowStatus: RuntimeStatus;

  @Prop({
    type: Array,
    required: true,
    default: [],
  })
  tasks: any[];

  @Prop({
    type: Array,
    required: true,
    default: [],
  })
  logs: Array<LogObject>;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Definition',
    required: true,
  })
  workflowDefinitionId: Definition;
}

export type RuntimeDocument = HydratedDocument<
  Runtime,
  {
    createdAt: string;
    updatedAt: string;
  }
>;

export const RuntimeSchema = SchemaFactory.createForClass(Runtime);
