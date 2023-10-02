import { Task } from '@/engine/tasks';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export enum DefinitionStatus {
  'active' = 'active',
  'inactive' = 'inactive',
}

@Schema({
  timestamps: true,
})
export class Definition {
  @ApiProperty({
    description: 'Name',
  })
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'Description',
  })
  @Prop({
    type: String,
    required: true,
  })
  description: string;

  @ApiProperty({
    description: 'Tasks List',
    type: [Object],
  })
  @Prop({
    type: Array,
    required: true,
    default: [],
  })
  tasks: Task[];

  @ApiProperty({
    description: 'Global Object',
    required: false,
    type: Object,
  })
  @Prop({
    type: Object,
    default: {},
    required: false,
  })
  global?: Record<string, any>;

  @ApiProperty({
    enum: DefinitionStatus,
    type: String,
    description: 'Status',
  })
  @Prop({
    type: String,
    required: true,
    enum: DefinitionStatus,
    default: 'active',
  })
  status: DefinitionStatus;

  @ApiProperty({
    type: Object,
    description: 'UI Object - Used by Frontend only',
  })
  @Prop({
    type: Object,
    required: false,
  })
  uiObject?: Record<string, any>;
}

export type DefinitionDocument = HydratedDocument<
  Definition,
  {
    createdAt: string;
    updatedAt: string;
  }
>;

export const DefinitionSchema = SchemaFactory.createForClass(Definition);
