import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartWorkflowDto {
  @ApiProperty({
    name: 'workflowDefinitionId',
    type: String,
    required: true,
    description: 'Workflow Definition Id',
  })
  @IsString()
  @IsNotEmpty()
  workflowDefinitionId!: string;

  @ApiProperty({
    name: 'globalParams',
    type: Map,
    required: false,
    description: 'Workflow GlobalParams',
  })
  @IsOptional()
  globalParams?: Record<string, any>;
}
