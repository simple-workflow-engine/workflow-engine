import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ConsumerService } from './consumer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DLQ, DLQSchema } from './dlq.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: DLQ.name, schema: DLQSchema }])],
  providers: [ProducerService, ConsumerService],
  exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}
