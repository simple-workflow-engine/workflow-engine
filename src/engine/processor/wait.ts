import type { Task } from '../tasks';

export class WaitProcessor {
  async process(
    params: {
      taskNames: string[];
    },
    task: Task,
    allTasks: Task[],
  ): Promise<
    | [
        {
          response: boolean;
        },
        null,
      ]
    | [
        null,
        {
          message: string;
          error?: string;
          stackTrace?: string;
        },
      ]
  > {
    const waitTasks = allTasks?.filter((taskItem) =>
      params.taskNames.includes(taskItem.name),
    );

    const waitTasksCompleted = waitTasks?.every(
      (taskItem) => taskItem.status === 'completed',
    );
    return [
      {
        response: waitTasksCompleted,
      },
      null,
    ];
  }
}
