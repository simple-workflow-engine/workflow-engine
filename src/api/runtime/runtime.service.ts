import type { Task } from "@/engine/tasks";
import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";
import { WorkflowRuntime } from "@/models";
import type { ObjectId } from "mongoose";
import { Types } from "mongoose";

export class RuntimeService {
  private logChild = logger.child({
    name: RuntimeService.name,
  });

  constructor() {}

  async getRuntimeDetail(id: string): Promise<
    | [
        {
          message: string;
          data: {
            _id: ObjectId;
            createdAt: string;
            updatedAt: string;
            tasks: Task[];
            logs: Array<`${string} : ${string} : ${string}`>;
            splittedLogs: Array<{
              datetime: string;
              taskName: string;
              log: string;
            }>;
            definition: {
              _id: ObjectId;
              name: string;
              status: "active" | "inactive";
            };
          };
          statusCode: number;
        },
        null
      ]
    | [
        null,
        {
          message: string;
          error: string;
          statusCode: number;
        }
      ]
  > {
    const runtimeDetailResult = await asyncHandler(
      (async () =>
        await WorkflowRuntime.aggregate<{
          _id: ObjectId;
          createdAt: string;
          updatedAt: string;
          tasks: Task[];
          logs: Array<`${string} : ${string} : ${string}`>;
          definition: {
            _id: ObjectId;
            name: string;
            status: "active" | "inactive";
          };
        }>([
          {
            $match: {
              _id: new Types.ObjectId(id),
            },
          },
          {
            $lookup: {
              from: "workflowdefinitions",
              localField: "workflowDefinitionId",
              foreignField: "_id",
              as: "definition",
            },
          },
          {
            $unwind: {
              path: "$definition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              global: 1,
              workflowStatus: 1,
              tasks: 1,
              logs: 1,
              createdAt: 1,
              updatedAt: 1,
              "definition._id": 1,
              "definition.name": 1,
              "definition.status": 1,
            },
          },
        ]))()
    );

    if (!runtimeDetailResult.success) {
      this.logChild.error(`WorkflowRuntime detail result aggregate failed for ${id}`);
      this.logChild.error(runtimeDetailResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `WorkflowRuntime detail result aggregate failed for ${id}`,
          statusCode: 500,
        },
      ];
    }

    const runtime = runtimeDetailResult.result?.at(0);

    if (!runtime) {
      return [
        null,
        {
          message: "Not Found",
          error: `Can not find WorkflowRuntime for ${id}`,
          statusCode: 404,
        },
      ];
    }

    const splittedLogs =
      runtime?.logs.map((logString) => {
        const [datetime, taskName, log] = logString.split(" : ").map((i) => i.trim());
        return {
          datetime,
          taskName,
          log,
        };
      }) ?? [];

    return [
      {
        data: { ...runtime, splittedLogs },
        message: "Runtime detail fetched successfully",
        statusCode: 200,
      },
      null,
    ];
  }
}
