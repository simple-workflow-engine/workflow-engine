import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
  public async getRuntimeDetail(@Param('id') id: string) {
    return this.runtimeService.getRuntimeDetail(id);
  }
}
