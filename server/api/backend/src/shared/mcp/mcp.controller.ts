import { All, Controller, Logger, NotFoundException, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';
import { SkipRateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { SkipDateTransform } from 'src/shared/interceptors/date-transform.interceptor';
import { McpConfig } from './mcp.config';
import { McpServerHandler } from './mcp.server';

/** Hop-by-hop and length headers that must not be copied onto the rebuilt fetch Request. */
const DROPPED_REQUEST_HEADERS = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive']);

/**
 * /api/mcp — Streamable HTTP endpoint for the Forge gateway.
 *
 * Every request must carry the gateway credential (`Authorization: Bearer MCP_GATEWAY_TOKEN`).
 * It authenticates Forge only; tool calls additionally require a per-call user assertion,
 * checked by the dispatcher. Per-user limits are applied per tool, so the IP-keyed global
 * limit (every call arrives from the gateway) is skipped here. The JSON-RPC envelope is passed to
 * the SDK untouched; the dispatcher applies the HTTP date conversion to tool arguments only.
 */
@SkipRateLimit()
@SkipDateTransform()
@Controller('mcp')
export class McpController {
   private readonly logger = new Logger(McpController.name);

   constructor(
      private readonly config: McpConfig,
      private readonly server: McpServerHandler,
   ) {}

   @All()
   async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
      if (!this.config.enabled) {
         throw new NotFoundException();
      }
      const origin = req.headers.origin;
      if (origin && !this.config.isOriginAllowed(origin)) {
         this.reject(res, 403, 'Origin not allowed');
         return;
      }
      if (!this.hasGatewayCredential(req)) {
         res.setHeader('WWW-Authenticate', 'Bearer realm="mcp"');
         this.reject(res, 401, 'Missing or invalid gateway credential');
         return;
      }
      if (req.method === 'POST' && !req.is('application/json')) {
         this.reject(res, 415, 'Content-Type must be application/json');
         return;
      }

      const response = await this.server.handler.fetch(this.toFetchRequest(req), { parsedBody: req.body });
      await this.send(res, response);
   }

   private hasGatewayCredential(req: Request): boolean {
      const expected = this.config.gatewayTokenDigest;
      const header = req.headers.authorization;
      if (!expected || !header?.startsWith('Bearer ')) {
         return false;
      }
      const presented = createHash('sha256').update(header.slice('Bearer '.length).trim()).digest();
      return timingSafeEqual(presented, expected);
   }

   private toFetchRequest(req: Request): globalThis.Request {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
         if (value === undefined || DROPPED_REQUEST_HEADERS.has(name)) {
            continue;
         }
         headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      return new globalThis.Request(this.config.resourceUrl, { method: req.method, headers });
   }

   private async send(res: Response, response: globalThis.Response): Promise<void> {
      res.status(response.status);
      response.headers.forEach((value, name) => {
         res.setHeader(name, value);
      });
      if (!response.body) {
         res.end();
         return;
      }
      await new Promise<void>((resolve, reject) => {
         Readable.fromWeb(response.body as ReadableStream<Uint8Array>)
            .on('error', error => {
               this.logger.warn(`MCP response stream failed: ${error.message}`);
               reject(error);
            })
            .pipe(res)
            .on('finish', () => resolve());
      });
   }

   private reject(res: Response, status: number, message: string): void {
      res.status(status).json({ jsonrpc: '2.0', error: { code: -32000, message }, id: null });
   }
}
