import { TaskStatus, type Task } from '../tasks';

export class WaitProcessor {
  async process(
    waitTaskNames: string[],
    allTasks: Task[],
  ): Promise<{
    response: boolean;
  }> {
    const waitTasks = allTasks?.filter((taskItem) =>
      waitTaskNames.includes(taskItem.name),
    );

    const waitTasksCompleted = waitTasks?.every(
      (taskItem) => taskItem.status === TaskStatus.completed,
    );
    return {
      response: waitTasksCompleted,
    };
  }
}
