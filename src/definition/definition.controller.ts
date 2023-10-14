import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DefinitionService } from './definition.service';
import { AuthGuard } from '@nestjs/passport';
import { AddDefinitionDto } from './dto/add-workflow.dto';
import { Definition } from './definition.schema';
import { EditDefinitionDto } from './dto/edit-definition.dto';
import { Request } from 'express';

@ApiTags('Definition')
@Controller('definition')
export class DefinitionController {
  constructor(private definitionService: DefinitionService) {}

  @Get('/list')
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
  public async definitionList(@Req() req: Request) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.definitionService.definitionList(req.user.sub);
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      title: AddDefinitionDto.name,
    },
    type: AddDefinitionDto,
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
  public async addWorkflowDefinition(
    @Body() body: AddDefinitionDto,
    @Req() req: Request,
  ) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.definitionService.createDefinition(body, req?.user?.sub);
  }

  @Put('/edit/:id')
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Definition Id',
    required: true,
    schema: {
      title: 'id',
    },
  })
  @ApiOperation({
    description: 'It will update definition in database',
    summary: 'Workflow Definition Edit',
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiConsumes('application/json')
  @ApiInternalServerErrorResponse()
  @ApiBody({
    schema: {
      title: EditDefinitionDto.name,
    },
    type: EditDefinitionDto,
    required: true,
  })
  public async edit(
    @Param('id') id: string,
    @Body() body: EditDefinitionDto,
    @Req() req: Request,
  ) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.definitionService.editDefinition(id, body, req?.user?.sub);
  }

  @Get('/:id/detail')
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Definition Id',
    required: true,
    schema: {
      title: 'id',
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiInternalServerErrorResponse()
  @ApiNotFoundResponse()
  @ApiOkResponse({
    type: Definition,
    schema: {
      title: 'DefinitionDetail',
    },
  })
  @ApiOperation({
    description:
      'It will return definition document with all corelated runtime documents also',
    summary: 'Workflow Definition Detail',
  })
  public async getDefinitionDetail(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.definitionService.definitionDetail(id, req?.user?.sub);
  }

  @Get('/:id')
  @ApiParam({
    type: String,
    name: 'id',
    description: 'Definition Id',
    required: true,
    schema: {
      title: 'id',
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('jwt')
  @ApiInternalServerErrorResponse()
  @ApiNotFoundResponse()
  @ApiOkResponse({
    type: Definition,
    schema: {
      title: 'Definition',
    },
  })
  @ApiOperation({
    description: 'It will return definition document',
    summary: 'Workflow Definition',
  })
  public async getDefinition(@Param('id') id: string, @Req() req: Request) {
    if (!req?.user?.sub) {
      throw new UnauthorizedException();
    }
    return this.definitionService.getDefinition(id, req?.user?.sub);
  }
}
