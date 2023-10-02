import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RuntimeService } from './runtime.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('runtime')
@ApiTags('Runtime')
export class RuntimeController {
  constructor(private runtimeService: RuntimeService) {}

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  public async getRuntimeDetail(@Param('id') id: string) {
    return this.runtimeService.getRuntimeDetail(id);
  }
}
