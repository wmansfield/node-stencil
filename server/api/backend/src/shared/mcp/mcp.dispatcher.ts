import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { createHash, randomUUID } from 'crypto';
import { MCP_FEATURE_BINDINGS } from 'src/features/mcp.registry';
import { AccountResolution, AccountResolver } from 'src/shared/access-control/account-resolver.service';
import { RateLimitService } from 'src/shared/access-control/rate-limit.service';
import { FeatureRequest } from 'src/shared/types/feature-request';
import { SanitizedPipe } from 'src/shared/utils/sanitized.pipe';
import { UIException } from 'src/shared/exceptions/friendly-exception';
import { formatString } from 'src/shared/utils/string.utils';
import { transformDates } from 'src/shared/utils/date-transform';
import { ItemResult } from 'src/shared/types/data/item-result';
import { ListResult } from 'src/shared/types/data/list-result';
import { McpBoundTool, McpOperationResult, McpResultKind, McpToolDefinition } from './mcp.types';
import { MCP_IDENTITY_ARGUMENT, McpIdentity, McpIdentityError, McpIdentityVerifier } from './mcp-identity.verifier';
import { McpConfig } from './mcp.config';

const TOOL_RATE_LIMIT = { points: 30, duration: 60 };

/** JSON-RPC error codes from the implementation-defined range (-32000 to -32019). */
export enum McpErrorCode {
   unauthorized = -32001,
   unknownTool = -32602,
}

export class McpProtocolFailure extends Error {
   constructor(readonly code: McpErrorCode, message: string) {
      super(message);
   }
}

export interface McpTextContent {
   type: 'text';
   text: string;
}

export interface McpToolCallResult {
   content: McpTextContent[];
   structuredContent?: object;
   isError?: boolean;
}

interface ResolvedTool {
   tool: McpBoundTool;
   controller: unknown;
}

enum McpCallOutcome {
   ok = 'ok',
   tool_error = 'tool_error',
   rejected = 'rejected',
   failed = 'failed',
}

interface McpAuditEvent {
   event: 'mcp.tool_call';
   tool: string;
   outcome: McpCallOutcome;
   duration_ms: number;
   call_id: string;
   forge_rid?: string;
   actor?: string;
   sub?: string;
   account_id?: string;
   jurisdiction_id?: string;
   args_hash?: string;
   detail?: string;
}

/**
 * Runs MCP tool calls against generated feature bindings. Identity comes only from the
 * verified Forge assertion; tenant scope only from the resolved account.
 */
@Injectable()
export class McpDispatcher implements OnModuleInit {
   private readonly logger = new Logger(McpDispatcher.name);
   private readonly tools = new Map<string, ResolvedTool>();
   private definitions: McpToolDefinition[] = [];

   constructor(
      private readonly moduleRef: ModuleRef,
      private readonly config: McpConfig,
      private readonly verifier: McpIdentityVerifier,
      private readonly accounts: AccountResolver,
      private readonly rateLimit: RateLimitService,
   ) {}

   onModuleInit(): void {
      for (const binding of MCP_FEATURE_BINDINGS) {
         const controller = this.moduleRef.get(binding.controller, { strict: false });
         for (const tool of binding.tools) {
            if (this.tools.has(tool.definition.name)) {
               throw new Error(`Duplicate MCP tool name: ${tool.definition.name}`);
            }
            this.tools.set(tool.definition.name, { tool, controller });
         }
      }
      this.definitions = [...this.tools.values()]
         .map(resolved => resolved.tool.definition)
         .sort((a, b) => a.name.localeCompare(b.name));
   }

   listTools(): McpToolDefinition[] {
      return this.definitions;
   }

   async callTool(name: string, rawArguments: unknown): Promise<McpToolCallResult> {
      const started = Date.now();
      const audit: McpAuditEvent = { event: 'mcp.tool_call', tool: name, outcome: McpCallOutcome.failed, duration_ms: 0, call_id: randomUUID() };
      try {
         const result = await this.execute(name, rawArguments, audit);
         audit.outcome = result.isError ? McpCallOutcome.tool_error : McpCallOutcome.ok;
         return result;
      } catch (error) {
         if (error instanceof McpProtocolFailure) {
            audit.outcome = McpCallOutcome.rejected;
            audit.detail = error.message;
            throw error;
         }
         return this.errorResult(error, audit);
      } finally {
         audit.duration_ms = Date.now() - started;
         this.logger.log(JSON.stringify(audit));
      }
   }

   private async execute(name: string, rawArguments: unknown, audit: McpAuditEvent): Promise<McpToolCallResult> {
      const resolved = this.tools.get(name);
      if (!resolved) {
         throw new McpProtocolFailure(McpErrorCode.unknownTool, `Unknown tool: ${name}`);
      }
      const args: Record<string, unknown> = isPlainObject(rawArguments) ? { ...rawArguments } : {};
      const assertion = args[MCP_IDENTITY_ARGUMENT];
      delete args[MCP_IDENTITY_ARGUMENT];
      audit.args_hash = hashArguments(args);

      const identity = await this.verifyIdentity(assertion, name);
      audit.actor = identity.actor;
      audit.sub = `${identity.sub.slice(0, 8)}***`;
      audit.forge_rid = identity.request_id;

      const request = await this.buildRequest(identity, audit);
      const limited = await this.consumeRateLimit(name, identity.sub);
      if (limited) {
         return limited;
      }

      let input: unknown = undefined;
      if (resolved.tool.requestModel) {
         try {
            // Same body shaping as HTTP (DateTransformInterceptor), so the controller sees identical input.
            input = SanitizedPipe.for(resolved.tool.requestModel).transform(transformDates(args), { type: 'body' });
         } catch (error) {
            if (error instanceof BadRequestException) {
               return textError(`Invalid arguments: ${httpMessage(error)}`);
            }
            throw error;
         }
      } else if (Object.keys(args).length > 0) {
         return textError(`Invalid arguments: this tool takes no arguments`);
      }

      const result = await resolved.tool.call(resolved.controller, request, input);
      return this.mapResult(resolved.tool.resultKind, result);
   }

   private async verifyIdentity(assertion: unknown, tool: string): Promise<McpIdentity> {
      try {
         return await this.verifier.verify(assertion, tool);
      } catch (error) {
         if (error instanceof McpIdentityError) {
            throw new McpProtocolFailure(McpErrorCode.unauthorized, `Caller identity could not be verified (${error.failure})`);
         }
         throw error;
      }
   }

   /** The same caller shape AuthGuard leaves on an HTTP request: verified auth payload plus live account. */
   private async buildRequest(identity: McpIdentity, audit: McpAuditEvent): Promise<FeatureRequest> {
      const { resolution, account } = await this.accounts.resolveLive(identity.sub);
      if (resolution !== AccountResolution.resolved || !account) {
         throw new McpProtocolFailure(McpErrorCode.unauthorized, `No active account for this caller (${resolution})`);
      }
      if (!this.config.isJurisdictionHosted(account.jurisdiction_id)) {
         throw new McpProtocolFailure(McpErrorCode.unauthorized, 'This caller is homed on a different regional instance');
      }
      audit.account_id = account._id;
      audit.jurisdiction_id = account.jurisdiction_id;
      return {
         account: account.toSelf(),
         auth: {
            payload: {
               sub: identity.sub,
               email: identity.email,
               email_verified: true,
               jurisdiction_id: account.jurisdiction_id,
               account_id: account._id,
               auth_provider: 'forge',
            },
         },
      };
   }

   private async consumeRateLimit(tool: string, sub: string): Promise<McpToolCallResult | undefined> {
      try {
         await this.rateLimit.consume(`mcp:${tool}:${sub}`, TOOL_RATE_LIMIT);
         return undefined;
      } catch (rejection) {
         if (rejection instanceof Error) {
            throw rejection;
         }
         const msBeforeNext = (rejection as RateLimitRejection).msBeforeNext ?? 0;
         return textError(`Rate limit exceeded for this tool. Retry after ${Math.ceil(msBeforeNext / 1000)} seconds.`);
      }
   }

   private mapResult(kind: McpResultKind, result: McpOperationResult): McpToolCallResult {
      if (!result.success) {
         const code = 'code' in result ? result.code : undefined;
         return textError(`The operation did not succeed${code ? ` (${code})` : ''}.`);
      }
      switch (kind) {
      case McpResultKind.item: {
         const item = toJson((result as ItemResult<unknown>).item ?? null);
         return isPlainObject(item) ? { content: [{ type: 'text', text: JSON.stringify(item) }], structuredContent: item } : textResult(JSON.stringify(item));
      }
      case McpResultKind.list: {
         const listResult = result as ListResult<unknown>;
         const structured = toJson({ items: listResult.items ?? [], paging: listResult.paging, stepping: listResult.stepping }) as object;
         return { content: [{ type: 'text', text: JSON.stringify(structured) }], structuredContent: structured };
      }
      case McpResultKind.action:
      default:
         return textResult(JSON.stringify({ success: true }));
      }
   }

   private errorResult(error: unknown, audit: McpAuditEvent): McpToolCallResult {
      if (error instanceof UIException) {
         const message = error.localizableString.args
            ? formatString(error.localizableString.default_text, error.localizableString.args)
            : error.localizableString.default_text;
         audit.outcome = McpCallOutcome.tool_error;
         return textError(message);
      }
      if (error instanceof HttpException && error.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR) {
         audit.outcome = McpCallOutcome.tool_error;
         return textError(httpMessage(error));
      }
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_IMPLEMENTED) {
         audit.detail = 'not_implemented';
         return textError('This tool is not available yet.');
      }
      audit.detail = error instanceof Error ? error.name : 'unknown';
      this.logger.error(`MCP tool ${audit.tool} failed (call ${audit.call_id})`, error instanceof Error ? error.stack : undefined);
      return textError(`The tool failed unexpectedly. Reference: ${audit.call_id}`);
   }
}

interface RateLimitRejection {
   msBeforeNext?: number;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
   return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJson(value: unknown): unknown {
   return JSON.parse(JSON.stringify(value));
}

function hashArguments(args: Record<string, unknown>): string {
   const sorted = Object.keys(args).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = args[key];
      return acc;
   }, {});
   return `sha256:${createHash('sha256').update(JSON.stringify(sorted)).digest('hex')}`;
}

function httpMessage(error: HttpException): string {
   const body = error.getResponse();
   if (typeof body === 'string') {
      return body;
   }
   const message = (body as HttpErrorBody).message;
   if (Array.isArray(message)) {
      return message.join('; ');
   }
   return typeof message === 'string' ? message : error.message;
}

interface HttpErrorBody {
   message?: string | string[];
}

function textResult(text: string): McpToolCallResult {
   return { content: [{ type: 'text', text }] };
}

function textError(text: string): McpToolCallResult {
   return { content: [{ type: 'text', text }], isError: true };
}
