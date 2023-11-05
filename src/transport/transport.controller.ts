import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { TransportService } from './transport.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
  ApiBasicAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { ProcessWorkflowDto } from './dto/process-workflow.dto';
import { Request } from 'express';
import { ProcessListenDto } from './dto/process-listen.dto';

@Controller('transport')
@ApiTags('Transport')
export class TransportController {
  constructor(private transportService: TransportService) {}

  @Post('/start')
  @ApiBody({
    schema: {
      title: StartWorkflowDto.name,
    },
    type: StartWorkflowDto,
    required: true,
  })
  @ApiOperation({
    description:
      'It will start workflow engine for specified definition with addition of global params',
    summary: 'Workflow Engine Start',
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiConsumes('application/json')
  public async startWorkflow(
    @Body() body: StartWorkflowDto,
    @Req() req: Request,
  ) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.transportService.startWorkflow(body, req?.user?.sub);
  }

  @Post('/process')
  @ApiBody({
    schema: {
      title: ProcessWorkflowDto.name,
    },
    type: ProcessWorkflowDto,
    required: true,
  })
  @ApiOperation({
    description:
      'It will start workflow engine for specified task name. This is Internal Path used by engine itself as HTTP Transport',
    summary: 'Workflow Engine Process',
  })
  @UseGuards(AuthGuard('basic'))
  @ApiBasicAuth('basic')
  @ApiConsumes('application/json')
  public async processWorkflow(@Body() body: ProcessWorkflowDto) {
    return this.transportService.processWorkflow(body);
  }

  @Post('/listen')
  @ApiBody({
    schema: {
      title: ProcessListenDto.name,
    },
    type: ProcessListenDto,
    required: true,
  })
  @ApiOperation({
    description: 'It will Process Listen Task with globalParams update',
    summary: 'Process Listen Task',
  })
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'Listen Task Security',
    example: 'x-api-key: abcdxc...',
  })
  @ApiConsumes('application/json')
  public async processListenTask(
    @Body() body: ProcessListenDto,
    @Req() req: Request,
  ) {
    const apiKeyHeader = req.headers?.['x-api-key'];
    const apiKey =
      typeof apiKeyHeader === 'object' ? apiKeyHeader?.at(0) : apiKeyHeader;
    if (!apiKey) {
      throw new UnauthorizedException({
        message: '`x-api-key` not found',
      });
    }
    return this.transportService.processListenTask(body, apiKey);
  }
}
