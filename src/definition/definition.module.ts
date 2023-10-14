import { Module } from '@nestjs/common';
import { DefinitionService } from './definition.service';
import { DefinitionController } from './definition.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Definition, DefinitionSchema } from './definition.schema';

@Module({
  providers: [DefinitionService],
  controllers: [DefinitionController],
  imports: [
    MongooseModule.forFeature([
      { name: Definition.name, schema: DefinitionSchema },
    ]),
  ],
})
export class DefinitionModule {}
