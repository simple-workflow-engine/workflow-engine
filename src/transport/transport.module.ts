import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { EngineModule } from '@/engine/engine.module';
import { Definition, DefinitionSchema } from '@/definition/definition.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Runtime, RuntimeSchema } from '@/runtime/runtime.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Runtime.name, schema: RuntimeSchema },
      { name: Definition.name, schema: DefinitionSchema },
    ]),
    EngineModule,
  ],
  controllers: [TransportController],
  providers: [TransportService],
})
export class TransportModule {}
