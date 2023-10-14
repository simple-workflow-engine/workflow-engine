import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { EngineModule } from '@/engine/engine.module';
import { Definition, DefinitionSchema } from '@/definition/definition.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Runtime, RuntimeSchema } from '@/runtime/runtime.schema';

import { KafkaModule } from '@/kafka/kafka.module';
import { WorkflowProcessConsumer } from './workflow-process.consumer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Runtime.name, schema: RuntimeSchema },
      { name: Definition.name, schema: DefinitionSchema },
    ]),
    EngineModule,
    KafkaModule,
  ],
  controllers: [TransportController],
  providers: [TransportService, WorkflowProcessConsumer],
})
export class TransportModule {}
