import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Definition } from '../definition/definition.schema';

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
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  workflowStatus: 'pending' | 'completed' | 'failed';

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
  logs: Array<`${string} : ${string} : ${string}`>;

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
