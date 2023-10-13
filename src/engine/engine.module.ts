import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Runtime, RuntimeSchema } from '@/runtime/runtime.schema';
import { Processor } from './processor';
import { EngineService } from './engine.service';
import { EngineTransport } from './engine.transport';
import { KafkaModule } from '@/kafka/kafka.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Runtime.name, schema: RuntimeSchema }]),
    KafkaModule,
  ],
  providers: [Processor, EngineService, EngineTransport],
  controllers: [],
  exports: [Processor],
})
export class EngineModule {}
