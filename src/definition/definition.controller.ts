import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DefinitionService } from './definition.service';
import { AuthGuard } from '@nestjs/passport';
import { AddWorkflowDto } from './dto/add-workflow.dto';
import { Definition } from './definition.schema';

@ApiTags('Definition')
@Controller('definition')
export class DefinitionController {
  constructor(private definitionService: DefinitionService) {}

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiOperation({
    description:
      'It will return array of Definition documents from the database',
    summary: 'Workflow Definition List',
  })
  @ApiOkResponse({
    type: Definition,
    isArray: true,
    schema: {
      title: 'DefinitionList',
    },
  })
  @ApiInternalServerErrorResponse()
  public async definitionList() {
    return this.definitionService.definitionList();
  }

  @Post('/add-workflow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      title: AddWorkflowDto.name,
    },
    type: AddWorkflowDto,
    required: true,
  })
  @ApiOperation({
    description: 'It will create new definition in database',
    summary: 'Workflow Definition Create',
  })
  @ApiCreatedResponse({
    type: Definition,
    schema: {
      title: 'DefinitionCreated',
    },
  })
  @ApiInternalServerErrorResponse()
  public async addWorkflow(@Body() body: AddWorkflowDto) {
    return this.definitionService.addWorkflow(body);
  }
}
