import {
  DefinitionStatusEnum,
  type DefinitionStatusType,
} from '../definition.schema';
import { TaskTypeEnum, TaskTypeType } from '@/engine/tasks';
import {
  IsArray,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class WorkflowTask {
  @ApiProperty({
    name: 'id',
    type: String,
    required: true,
    description: 'Task Id',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({
    name: 'name',
    type: String,
    required: true,
    description: 'Task Name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    name: 'type',
    type: String,
    enum: TaskTypeEnum,
    required: true,
    description: 'Task Type',
  })
  @IsEnum(TaskTypeEnum)
  @IsNotEmpty()
  @IsString()
  type!: TaskTypeType;

  @ApiProperty({
    name: 'next',
    type: [String],
    required: true,
    description: 'Task Next Item',
  })
  @IsArray()
  @IsNotEmpty()
  next!: string[];

  @ApiProperty({
    name: 'previous',
    type: [String],
    required: true,
    description: 'Task Previous Item',
  })
  @IsArray()
  @IsNotEmpty()
  previous!: string[];
}

class WorkflowData {
  @ApiProperty({
    name: 'name',
    type: String,
    required: true,
    description: 'Workflow Name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    name: 'description',
    type: String,
    required: true,
    description: 'Workflow description',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    name: 'status',
    type: String,
    enum: DefinitionStatusEnum,
    required: true,
    description: 'Workflow status',
  })
  @IsEnum(DefinitionStatusEnum)
  @IsNotEmpty()
  @IsString()
  status!: DefinitionStatusType;

  @ApiProperty({
    name: 'global',
    type: Map,
    required: false,
    description: 'Workflow Global Params',
    example: {
      key: 'value',
    },
  })
  @IsJSON()
  @IsOptional()
  global?: Record<string, any>;

  @ApiProperty({
    name: 'tasks',
    type: [WorkflowTask],
    required: true,
    description: 'Workflow Tasks',
  })
  @IsArray()
  @IsNotEmpty()
  tasks!: WorkflowTask[];
}

export class EditDefinitionDto {
  @ApiProperty({
    name: 'workflowData',
    type: WorkflowData,
    required: true,
    description: 'Workflow Definition Data',
  })
  @IsObject()
  @IsNotEmpty()
  workflowData!: WorkflowData;

  @ApiProperty({
    name: 'key',
    type: String,
    required: true,
    description: 'Frontend Framework slug',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    name: 'ui',
    required: false,
    description: 'UI Object',
    type: Map,
    example: {
      key: 'value',
    },
  })
  @IsJSON()
  @IsOptional()
  ui?: Record<string, any>;
}
