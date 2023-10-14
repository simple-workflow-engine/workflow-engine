import { Logger } from '@nestjs/common';
import { Kafka, Message, Producer } from 'kafkajs';
import { sleep } from '@lib/utils/sleep';
import { IProducer } from './producer.interface';

export class KafkajsProducer implements IProducer {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly logger: Logger;

  constructor(
    private readonly topic: string,
    broker: string,
    auth?: {
      username: string;
      password: string;
    },
  ) {
    this.kafka = new Kafka(
      auth
        ? {
            brokers: [broker],
            sasl: {
              mechanism: 'scram-sha-256',
              username: auth.username,
              password: auth.password,
            },
            ssl: true,
          }
        : {
            brokers: [broker],
          },
    );
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
    });
    this.logger = new Logger(topic);
  }

  async produce(message: Message) {
    await this.producer.send({ topic: this.topic, messages: [message] });
  }

  async connect() {
    try {
      await this.producer.connect();
    } catch (err) {
      this.logger.error('Failed to connect to Kafka.', err);
      await sleep(5000);
      await this.connect();
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}
