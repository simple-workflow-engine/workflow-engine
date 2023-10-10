import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefinitionService } from './definition.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Definition')
@Controller('definition')
export class DefinitionController {
  constructor(private definitionService: DefinitionService) {}

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  public async definitionList() {
    return this.definitionService.definitionList();
  }
}
