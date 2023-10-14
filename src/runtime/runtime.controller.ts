import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RuntimeService } from './runtime.service';
import { AuthGuard } from '@nestjs/passport';
import { Runtime } from './runtime.schema';
import { Request } from 'express';

@Controller('runtime')
@ApiTags('Runtime')
export class RuntimeController {
  constructor(private runtimeService: RuntimeService) {}

  @Get('/:id/detail')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiOperation({
    description:
      'It will return runtime document with corelated definition document',
    summary: 'Workflow Runtime Detail',
  })
  @ApiOkResponse({
    type: Runtime,
    schema: {
      title: 'RuntimeDetail',
    },
  })
  @ApiInternalServerErrorResponse()
  @ApiNotFoundResponse()
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Runtime Id',
    required: true,
    schema: {
      title: 'id',
    },
  })
  public async getRuntimeDetail(@Param('id') id: string, @Req() req: Request) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.runtimeService.getRuntimeDetail(id, req?.user?.sub);
  }
}
