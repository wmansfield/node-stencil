import { Type } from '@nestjs/common';
import { FeatureRequest } from 'src/shared/types/feature-request';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ListResult } from 'src/shared/types/data/list-result';
import { ActionResult } from 'src/shared/types/data/action-result';

export type JsonSchemaType = 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean' | 'null';

export interface JsonSchemaProperties {
   [property: string]: JsonSchema;
}

/** The JSON Schema 2020-12 subset emitted for MCP tool input and output schemas. */
export interface JsonSchema {
   type?: JsonSchemaType;
   title?: string;
   description?: string;
   format?: 'uuid' | 'date-time';
   properties?: JsonSchemaProperties;
   required?: string[];
   additionalProperties?: boolean;
   items?: JsonSchema;
   anyOf?: JsonSchema[];
   oneOf?: JsonSchema[];
   enum?: string[];
   const?: number | string;
   minLength?: number;
   maxLength?: number;
   minimum?: number;
   maximum?: number;
}

/** Input schemas describe what callers send; output schemas describe what tools return. */
export enum McpSchemaMode {
   input = 'input',
   output = 'output',
}

/** MCP tool annotations (behaviour hints for clients; never a security boundary). */
export interface McpToolAnnotations {
   readOnlyHint: boolean;
   destructiveHint: boolean;
   idempotentHint: boolean;
   openWorldHint: boolean;
}

export interface McpToolDefinition {
   name: string;
   title: string;
   description: string;
   inputSchema: JsonSchema;
   outputSchema?: JsonSchema;
   annotations: McpToolAnnotations;
}

/** Which result envelope the feature operation returns. */
export enum McpResultKind {
   item = 'item',
   list = 'list',
   action = 'action',
}

export type McpOperationResult = ItemResult<unknown> | ListResult<unknown> | ActionResult;

/** One generated tool, typed against its feature's operations contract. */
export interface McpFeatureTool<TOperations> {
   definition: McpToolDefinition;
   /** Sanitize registry key for the request model; absent when the tool takes no input. */
   requestModel?: Function;
   resultKind: McpResultKind;
   invoke: (operations: TOperations, request: FeatureRequest, input: unknown) => Promise<McpOperationResult>;
}

/** A tool after binding to its feature controller; the runtime resolves the controller instance. */
export interface McpBoundTool {
   definition: McpToolDefinition;
   requestModel?: Function;
   resultKind: McpResultKind;
   call: (controller: unknown, request: FeatureRequest, input: unknown) => Promise<McpOperationResult>;
}

export interface McpFeatureBinding {
   feature: string;
   controller: Type<unknown>;
   tools: McpBoundTool[];
}

export function bindMcpFeature<TOperations>(
   feature: string,
   controller: Type<TOperations>,
   tools: McpFeatureTool<TOperations>[],
): McpFeatureBinding {
   return {
      feature,
      controller,
      tools: tools.map(tool => ({
         definition: tool.definition,
         requestModel: tool.requestModel,
         resultKind: tool.resultKind,
         call: (instance: unknown, request: FeatureRequest, input: unknown) => tool.invoke(instance as TOperations, request, input),
      })),
   };
}
