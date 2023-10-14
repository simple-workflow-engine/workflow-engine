import { ProducerService } from './kafka/producer.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly producerService: ProducerService) {}

  async getHello(): Promise<string> {
    await this.producerService.produce('test', {
      value: 'Hello World',
    });
    return 'Hello World!';
  }
}
