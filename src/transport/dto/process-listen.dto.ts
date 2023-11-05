import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProcessListenDto {
  @ApiProperty({
    name: 'workflowRuntimeId',
    type: String,
    required: true,
    description: 'Workflow Runtime Id',
  })
  @IsString()
  @IsNotEmpty()
  workflowRuntimeId!: string;

  @ApiProperty({
    name: 'taskName',
    type: String,
    required: true,
    description: 'Workflow Definition Task Name',
  })
  @IsString()
  @IsNotEmpty()
  taskName!: string;

  @ApiProperty({
    name: 'globalParams',
    type: Map,
    required: false,
    description: 'Workflow GlobalParams',
  })
  @IsOptional()
  globalParams?: Record<string, any>;
}
