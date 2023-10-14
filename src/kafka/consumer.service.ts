import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsumerConfig, ConsumerSubscribeTopics, KafkaMessage } from 'kafkajs';
import { IConsumer } from './consumer.interface';
import { KafkajsConsumer } from './kafkajs.consumer';
import { InjectModel } from '@nestjs/mongoose';
import { DLQ } from './dlq.schema';
import { Model } from 'mongoose';

interface KafkajsConsumerOptions {
  topic: ConsumerSubscribeTopics;
  config: ConsumerConfig;
  onMessage: (message: KafkaMessage) => Promise<void>;
}

@Injectable()
export class ConsumerService implements OnApplicationShutdown {
  private readonly consumers: IConsumer[] = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(DLQ.name) private dlqService: Model<DLQ>,
  ) {}

  async consume({ topic, config, onMessage }: KafkajsConsumerOptions) {
    const broker = this.configService.get<string>('KAFKA_BROKER') ?? '';
    const NODE_ENV = this.configService.get<string>('NODE_ENV') ?? 'production';
    const consumer = new KafkajsConsumer(
      topic,
      this.dlqService,
      config,
      broker,
      NODE_ENV === 'development'
        ? undefined
        : {
            username: this.configService.get<string>('KAFKA_USERNAME') ?? '',
            password: this.configService.get<string>('KAFKA_PASSWORD') ?? '',
          },
    );
    await consumer.connect();
    await consumer.consume(onMessage);
    this.consumers.push(consumer);
  }

  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
