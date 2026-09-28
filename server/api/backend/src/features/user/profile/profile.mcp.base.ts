import { JsonSchema, McpFeatureTool, McpResultKind, McpSchemaMode } from 'src/shared/mcp/mcp.types';
import { objectSchema, schemaProperty } from 'src/shared/mcp/mcp.schema';
import * as schemas from 'src/features/mcp.schemas';
import { IProfileOperations } from './profile.operations';
import { INameRequest, NameRequest } from './models/namerequest';
import { IAvatarRequest, AvatarRequest } from './models/avatarrequest';

function featureSchema_AvatarRequest(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      asset_id: schemaProperty(mode, { type: 'string', format: 'uuid', title: 'Avatar Asset', description: 'Id of an image asset the caller uploaded.' }, false),
   }, ['asset_id']);
}

function featureSchema_NameRequest(mode: McpSchemaMode): JsonSchema {
   return objectSchema(mode, {
      display_name: schemaProperty(mode, { type: 'string', title: 'Display Name', description: 'Name shown to other people.' }, false),
   }, ['display_name']);
}

export const PROFILE_MCP_TOOLS: McpFeatureTool<IProfileOperations>[] = [
   {
      definition: {
         name: 'profile_update_display_name',
         title: 'Update display name',
         description: 'Set the signed-in user\'s display name. Returns the updated profile.',
         inputSchema: featureSchema_NameRequest(McpSchemaMode.input),
         outputSchema: schemas.itemSchema_Account_Self(McpSchemaMode.output),
         annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
         },
      },
      requestModel: NameRequest,
      resultKind: McpResultKind.item,
      invoke: (operations, request, input) => operations.nameUpdate(request, input as INameRequest),
   },
   {
      definition: {
         name: 'profile_update_avatar',
         title: 'Update avatar',
         description: 'Set the signed-in user\'s avatar to an image asset they uploaded. Returns the updated profile.',
         inputSchema: featureSchema_AvatarRequest(McpSchemaMode.input),
         outputSchema: schemas.itemSchema_Account_Self(McpSchemaMode.output),
         annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
         },
      },
      requestModel: AvatarRequest,
      resultKind: McpResultKind.item,
      invoke: (operations, request, input) => operations.avatarUpdate(request, input as IAvatarRequest),
   },
];