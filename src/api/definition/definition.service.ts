import { asyncHandler } from "@/lib/utils/asyncHandler";
import logger from "@/lib/utils/logger";
import type { WorkflowDefinitionDocument } from "@/models";
import { WorkflowDefinition } from "@/models";
import type { AddWorkflowBody, EditWorkflowBody } from "./definition.dto";
import type { ObjectId } from "mongoose";
import { Types } from "mongoose";

export class DefinitionService {
  private logChild = logger.child({
    name: DefinitionService.name,
  });

  constructor() {}

  public async getWorkflows(): Promise<
    | [
        {
          message: string;
          data: WorkflowDefinitionDocument[];
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
    const workflowDefinitionsResult = await asyncHandler(
      WorkflowDefinition.find<WorkflowDefinitionDocument>(
        {},
        {
          name: 1,
          _id: 1,
          status: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      )
    );

    if (!workflowDefinitionsResult.success) {
      this.logChild.error(`WorkflowDefinition find failed`);
      this.logChild.error(workflowDefinitionsResult.error);

      return [
        null,
        {
          message: "Internal Server Error",
          statusCode: 500,
          error: `WorkflowDefinition find failed`,
        },
      ];
    }

    return [
      {
        message: "WorkflowDefinition fetched successfully",
        statusCode: 200,
        data: workflowDefinitionsResult.result ?? [],
      },
      null,
    ];
  }

  public async addWorkflow(definitionData: AddWorkflowBody): Promise<
    | [
        {
          message: string;
          data: {
            success: boolean;
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
    const createdWorkflowDefinitionResult = await asyncHandler(
      WorkflowDefinition.create([
        {
          name: definitionData.workflowData.name,
          description: definitionData.workflowData.description,
          global: definitionData.workflowData.global,
          status: definitionData.workflowData.status,
          tasks: definitionData.workflowData.tasks,
          ...(definitionData?.ui && {
            uiObject: {
              [definitionData.key]: definitionData.ui,
            },
          }),
        },
      ])
    );

    if (!createdWorkflowDefinitionResult.success) {
      this.logChild.error(`Workflow Definition create failed`);
      this.logChild.error(createdWorkflowDefinitionResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `Workflow Definition create failed`,
          statusCode: 500,
        },
      ];
    }

    return [
      {
        message: "Workflow Definition created successfully",
        statusCode: 201,
        data: { success: !!createdWorkflowDefinitionResult.result },
      },
      null,
    ];
  }

  public async editWorkflow(
    id: string,
    definitionData: EditWorkflowBody
  ): Promise<
    | [
        {
          message: string;
          data: {
            success: boolean;
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
    const updatedWorkflowDefinitionResult = await asyncHandler(
      WorkflowDefinition.updateOne(
        {
          _id: id,
        },
        {
          name: definitionData.workflowData.name,
          description: definitionData.workflowData.description,
          global: definitionData.workflowData.global,
          status: definitionData.workflowData.status,
          tasks: definitionData.workflowData.tasks,
          ...(definitionData?.ui && {
            uiObject: {
              [definitionData.key]: definitionData.ui,
            },
          }),
        }
      )
    );

    if (!updatedWorkflowDefinitionResult.success) {
      this.logChild.error(`Workflow Definition updateOne failed for ${id}`);
      this.logChild.error(updatedWorkflowDefinitionResult.error);
      return [
        null,
        {
          message: "Internal Server Error",
          error: `Workflow Definition updateOne failed for ${id}`,
          statusCode: 500,
        },
      ];
    }

    return [
      {
        message: "Workflow Definition updated successfully",
        statusCode: 200,
        data: { success: !!updatedWorkflowDefinitionResult.result },
      },
      null,
    ];
  }

  public async getWorkflowDetail(id: string): Promise<
    | [
        {
          message: string;
          data: {
            _id: ObjectId;
            name: string;
            description: string;
            status: "active" | "inactive";
            createdAt: string;
            updatedAt: string;
            runtimes: any[];
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
    const workflowDefinitionDetailResult = await asyncHandler(
      WorkflowDefinition.aggregate<{
        _id: ObjectId;
        name: string;
        description: string;
        status: "active" | "inactive";
        createdAt: string;
        updatedAt: string;
        runtimes: Array<{
          _id: ObjectId;
          workflowStatus: "pending" | "completed";
          createdAt: string;
          updatedAt: string;
        }>;
      }>([
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "workflowruntimes",
            localField: "_id",
            foreignField: "workflowDefinitionId",
            as: "runtimes",
            pipeline: [
              {
                $sort: {
                  createdAt: -1,
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            "runtimes._id": 1,
            "runtimes.workflowStatus": 1,
            "runtimes.createdAt": 1,
            "runtimes.updatedAt": 1,
          },
        },
      ]).then((res) => res)
    );

    if (!workflowDefinitionDetailResult.success) {
      this.logChild.error(`WorkflowDefinition detail result aggregate failed for ${id}`);
      this.logChild.error(workflowDefinitionDetailResult.error);
      return [
        null,
        {
          error: `WorkflowDefinition detail result aggregate failed for ${id}`,
          message: "Internal Server Error",
          statusCode: 500,
        },
      ];
    }
    const workflowDefinition = workflowDefinitionDetailResult?.result?.at(0);
    if (!workflowDefinition) {
      return [
        null,
        {
          message: "Not Found",
          error: `Can not find WorkflowDefinition for ${id}`,
          statusCode: 404,
        },
      ];
    }

    return [
      {
        data: workflowDefinition,
        message: "Workflow detail fetched successfullt",
        statusCode: 200,
      },
      null,
    ];
  }

  public async getSingleWorkflow(id: string): Promise<
    | [
        {
          message: string;
          data: WorkflowDefinitionDocument;
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
    const workflowDetailResult = await asyncHandler(WorkflowDefinition.findById<WorkflowDefinitionDocument>(id));

    if (!workflowDetailResult.success) {
      this.logChild.error(`WorkflowDefinition findById failed for ${id}`);
      this.logChild.error(workflowDetailResult.error);
      return [
        null,
        {
          error: `WorkflowDefinition findById failed for ${id}`,
          message: "Internal Server Error",
          statusCode: 500,
        },
      ];
    }

    if (!workflowDetailResult.result) {
      return [
        null,
        {
          error: `Can not found WorkflowDefinition for ${id}`,
          message: "Not found",
          statusCode: 404,
        },
      ];
    }

    return [
      {
        message: "Workflow Definition fetched successfully",
        data: workflowDetailResult.result,
        statusCode: 200,
      },
      null,
    ];
  }
}
