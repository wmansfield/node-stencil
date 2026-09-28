import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigResolver } from 'src/config/config.resolver';
import { ConfigTemplates } from 'src/config/config.templates';
import { SHARED_TENANT_CODE } from 'src/shared/constants/tenants';

/**
 * MCP endpoint settings. The endpoint is off unless MCP_RESOURCE_URL (the exact URL registered on
 * the MCP gateway, which is also the identity token audience) and MCP_GATEWAY_TOKEN (the credential
 * stored on that gateway) are configured. MCP_IDENTITY_ISSUER (the gateway issuer whose JWKS signs
 * per-call identity assertions) is then required.
 */
@Injectable()
export class McpConfig implements OnModuleInit {
   private readonly logger = new Logger(McpConfig.name);
   private _resourceUrl = '';
   private _gatewayTokenDigest: Buffer | null = null;
   private _allowedOrigins = new Set<string>();
   private _issuer = '';
   private _hostedJurisdictions = new Set<string>();

   constructor(private readonly configResolver: ConfigResolver) {}

   async onModuleInit(): Promise<void> {
      const resourceUrl = (await this.configResolver.getValue(ConfigTemplates.McpResourceUrl()))?.trim().replace(/\/$/, '') ?? '';
      const gatewayToken = (await this.configResolver.getValue(ConfigTemplates.McpGatewayToken()))?.trim() ?? '';
      const origins = (await this.configResolver.getValue(ConfigTemplates.McpAllowedOrigins())) ?? '';
      const issuer = (await this.configResolver.getValue(ConfigTemplates.McpIdentityIssuer()))?.trim().replace(/\/$/, '') ?? '';
      const hosted = (await this.configResolver.getValue(ConfigTemplates.FederationJurisdiction())) ?? '';

      this._allowedOrigins = new Set(origins.split(',').map(o => o.trim()).filter(o => o.length > 0));
      this._hostedJurisdictions = new Set(
         hosted
            .split(',')
            .map(j => j.trim().toUpperCase())
            .filter(j => j.length > 0 && j !== SHARED_TENANT_CODE),
      );
      if (!resourceUrl || !gatewayToken) {
         this.logger.log('MCP endpoint disabled (set MCP_RESOURCE_URL and MCP_GATEWAY_TOKEN to enable)');
         return;
      }
      if (gatewayToken.length < 32) {
         throw new Error('MCP_GATEWAY_TOKEN must be at least 32 characters.');
      }
      if (!issuer) {
         throw new Error('MCP_IDENTITY_ISSUER is required when the MCP endpoint is enabled.');
      }
      this._issuer = issuer;
      this._resourceUrl = resourceUrl;
      this._gatewayTokenDigest = createHash('sha256').update(gatewayToken).digest();
      this.logger.log(`MCP endpoint enabled for ${resourceUrl} (identity issuer ${this._issuer})`);
   }

   get enabled(): boolean {
      return this._gatewayTokenDigest !== null;
   }

   get resourceUrl(): string {
      return this._resourceUrl;
   }

   get gatewayTokenDigest(): Buffer | null {
      return this._gatewayTokenDigest;
   }

   get issuer(): string {
      return this._issuer;
   }

   isOriginAllowed(origin: string): boolean {
      return this._allowedOrigins.has(origin);
   }

   /** When FEDERATION_JURISDICTION is unset (single-instance dev), every jurisdiction is local. */
   isJurisdictionHosted(jurisdiction_id: string): boolean {
      return this._hostedJurisdictions.size === 0 || this._hostedJurisdictions.has(jurisdiction_id.toUpperCase());
   }
}
