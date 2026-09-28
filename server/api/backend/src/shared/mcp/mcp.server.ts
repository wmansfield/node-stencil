import { Injectable } from '@nestjs/common';
import { CallToolResult, createMcpHandler, McpHttpHandler, ProtocolError, Server, Tool } from '@modelcontextprotocol/server';
import { McpDispatcher, McpProtocolFailure, McpToolCallResult } from './mcp.dispatcher';
import { McpToolDefinition } from './mcp.types';

const SERVER_NAME = 'stencil';
const SERVER_VERSION = '1.0.0';
/** tools/list is identical for every caller and changes only on deploy. */
const TOOL_LIST_TTL_MS = 5 * 60 * 1000;

/**
 * The MCP protocol surface: one stateless server per request, serving 2026-07-28 natively
 * and 2025-era clients (the Forge gateway today) through the SDK's stateless fallback.
 */
@Injectable()
export class McpServerHandler {
   readonly handler: McpHttpHandler;

   constructor(private readonly dispatcher: McpDispatcher) {
      this.handler = createMcpHandler(() => this.buildServer(), { legacy: 'stateless' });
   }

   private buildServer(): Server {
      const server = new Server({ name: SERVER_NAME, version: SERVER_VERSION }, { capabilities: { tools: {} } });
      server.setRequestHandler('tools/list', async () => ({
         tools: this.dispatcher.listTools().map(toSdkTool),
         ttlMs: TOOL_LIST_TTL_MS,
         cacheScope: 'public' as const,
      }));
      server.setRequestHandler('tools/call', async request => {
         try {
            return toSdkResult(await this.dispatcher.callTool(request.params.name, request.params.arguments));
         } catch (error) {
            if (error instanceof McpProtocolFailure) {
               throw new ProtocolError(error.code, error.message);
            }
            throw error;
         }
      });
      return server;
   }
}

/** Generated input schemas are always objects (objectSchema / emptyInputSchema). */
function toSdkTool(definition: McpToolDefinition): Tool {
   const tool: Tool = {
      name: definition.name,
      title: definition.title,
      description: definition.description,
      inputSchema: definition.inputSchema as Tool['inputSchema'],
      annotations: { title: definition.title, ...definition.annotations },
   };
   if (definition.outputSchema) {
      tool.outputSchema = definition.outputSchema as Tool['outputSchema'];
   }
   return tool;
}

function toSdkResult(result: McpToolCallResult): CallToolResult {
   const sdkResult: CallToolResult = { content: result.content };
   if (result.structuredContent !== undefined) {
      sdkResult.structuredContent = result.structuredContent as CallToolResult['structuredContent'];
   }
   if (result.isError) {
      sdkResult.isError = true;
   }
   return sdkResult;
}
