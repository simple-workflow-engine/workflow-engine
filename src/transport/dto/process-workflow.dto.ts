import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessWorkflowDto {
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
}
