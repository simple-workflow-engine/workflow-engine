import { ProducerService } from '@/kafka/producer.service';
import { safeAsync } from '@/lib/utils/safe';
import { TOPIC_NAME } from '@/transport/workflow-process.consumer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

type AvailableTransport = 'kafka' | 'http';

@Injectable()
export class EngineTransport {
  private logger = new Logger(EngineTransport.name);

  constructor(
    private producerService: ProducerService,
    private configService: ConfigService,
  ) {}

  async processNextTask(body: { workflowRuntimeId: string; taskName: string }) {
    const transportName =
      this.configService.get<AvailableTransport>('ENGINE_TRANSPORT') ?? 'http';

    const apiKey = this.configService.get<string>('API_KEY') ?? '';
    if (transportName === 'http') {
      axios({
        method: 'POST',
        baseURL: this.configService.get<string>('DEPLOYED_URL'),
        url: '/transport/process',
        data: {
          workflowRuntimeId: body.workflowRuntimeId,
          taskName: body.taskName,
        },
        auth: {
          username: 'workflow',
          password: apiKey,
        },
      }).catch((error) => {
        if (error instanceof AxiosError) {
          this.logger.error(error?.response?.data);
        } else {
          this.logger.error(error);
        }
      });
    } else if (transportName === 'kafka') {
      safeAsync(
        this.producerService.produce(TOPIC_NAME, {
          value: JSON.stringify(body),
          headers: {
            'X-Idenpotent-Key': crypto.randomUUID(),
            'X-Api-Key': apiKey,
          },
        }),
      );
    } else {
      this.logger.error('Unknown Transport');
      // How the hell did this ran?
      throw new Error('Unknown Transport');
    }
  }
}
