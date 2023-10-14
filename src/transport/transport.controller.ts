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
} from '@nestjs/swagger';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { ProcessWorkflowDto } from './dto/process-workflow.dto';
import { Request } from 'express';

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
}
