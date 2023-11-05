import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Definition } from '../definition/definition.schema';
import { LogObject } from '@/engine/logger';
import { ApiProperty } from '@nestjs/swagger';
import { Task } from '@/engine/tasks';

export const RuntimeStatus = {
  pending: 'pending',
  completed: 'completed',
  failed: 'failed',
} as const;

export type RuntimeStatusType = keyof typeof RuntimeStatus;
export const RuntimeStatusEnum = Object.keys(RuntimeStatus);

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
  workflowStatus!: RuntimeStatusType;

  @Prop({
    type: Array,
    required: true,
    default: [],
  })
  tasks!: Task[];

  @Prop({
    type: Array,
    required: true,
    default: [],
  })
  logs!: Array<LogObject>;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Definition',
    required: true,
  })
  workflowDefinitionId!: Definition;

  @ApiProperty({
    type: String,
    description: 'User Id',
  })
  @Prop({
    type: String,
    required: true,
  })
  userId!: string;
}

export type RuntimeDocument = HydratedDocument<
  Runtime,
  {
    createdAt: string;
    updatedAt: string;
  }
>;

export const RuntimeSchema = SchemaFactory.createForClass(Runtime);
