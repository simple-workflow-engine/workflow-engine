import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConsumerService } from '@/kafka/consumer.service';
import { z } from 'zod';
import { TransportService } from './transport.service';

const MessageBodySchema = z.object({
  workflowRuntimeId: z
    .string({
      required_error: 'Workflow Runtime Id is required',
    })
    .min(1, {
      message: 'Workflow Runtime Id is required',
    }),
  taskName: z
    .string({
      required_error: 'Task Name is required',
    })
    .min(1, {
      message: 'Task Name is required',
    }),
});

export const TOPIC_NAME = 'workflow_process' as const;

@Injectable()
export class WorkflowProcessConsumer implements OnModuleInit {
  constructor(
    private readonly consumerService: ConsumerService,
    @Inject(forwardRef(() => TransportService))
    private readonly transportService: TransportService,
  ) {}

  async onModuleInit() {
    await this.consumerService.consume({
      topic: { topics: [TOPIC_NAME] },
      config: { groupId: 'test-consumer' },
      onMessage: async (message) => {
        const messageString = message.value?.toString();

        if (!messageString) {
          throw new Error('No body attached');
        }

        const messageValue = JSON.parse(messageString);

        const parsedMessage = MessageBodySchema.parse(messageValue);

        this.transportService.processWorkflow(parsedMessage);
      },
    });
  }
}
