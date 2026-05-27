import { Injectable, Logger } from '@nestjs/common';
import { IConfigSource } from './config.types';
import { EnvironmentConfigSource } from './config.source.environment';
import { VaultConfigSource } from './config.source.vault';
import { TenantConfig } from './config.types';
import { ConfigTemplates } from './config.templates';
import { INTERNAL_AUTHORITY, KMS_AWS, KMS_AZURE } from 'src/shared/shared.constants';
import { AwsSecretsConfigSource } from './config.source.aws';
import { SHARED_TENANT_CODE } from 'src/shared/constants/tenants';

@Injectable()
export class ConfigResolver {
   private readonly logger = new Logger(ConfigResolver.name);
   private sources = new Map<string, IConfigSource>();
   private defaultSources: IConfigSource[] = [];
   private initialized = false;
   private tenants = new Map<string, TenantConfig>();

   constructor() {}

   async init(): Promise<void> {
      if (this.initialized) {
         return;
      }

      // Always add environment as fallback
      const environmentSource = new EnvironmentConfigSource();
      this.sources.set(environmentSource.name, environmentSource);
      this.defaultSources.push(environmentSource);

      this.initialized = true;

      // Add internal authority, if configured
      const source = await this.loadSource(INTERNAL_AUTHORITY);
      if (source) {
         if (!this.sources.has(source.name)) {
            this.sources.set(source.name, source);
            this.defaultSources.push(source);
         }
      }
   }

   async ensureAuthority(authority: string) {
      if (!this.sources.has(authority)) {
         const source = await this.loadSource(authority);
         if (!source) {
            throw new Error(`Requested authority for ${authority} but its configuration did not exist.`);
         }
         this.sources.set(authority, source);
      }
   }

   async loadSource(authority: string): Promise<AwsSecretsConfigSource | undefined> {
      const region = await this.getValue(ConfigTemplates.AuthorityAwsSecretsRegion(authority), undefined);
      const prefix = await this.getValue(ConfigTemplates.AuthorityAwsSecretsPrefix(authority), undefined);

      if (!region) {
         this.logger.debug(`No AWS Secrets region configured for authority "${authority}". Using environment only.`);
         return undefined;
      }

      return new AwsSecretsConfigSource(authority, region, prefix);
   }

   async getValue(key: string, specificSource?: string): Promise<string | undefined> {
      if (!this.initialized) {
         await this.init();
      }

      let sources = this.defaultSources;
      if (specificSource) {
         sources = [];
         const found = this.sources.get(specificSource);
         if (found) {
            sources.push(found);
         }
      }

      for (const source of sources) {
         if (specificSource && source.name != specificSource) {
            continue;
         }
         const value = await source.getValue(key);
         if (value !== undefined) {
            this.logger.debug(`Resolved config key "${key}" from source "${source.name}"`);
            return value;
         }
      }
      this.logger.debug(`Failed to Resolve config key "${key}"`);
      return undefined;
   }

   private async resolveTenantSpecificSource(tenant_code: string): Promise<string | undefined> {
      const authority = await this.getValue(ConfigTemplates.Authority(tenant_code), undefined);
      if (authority && authority != INTERNAL_AUTHORITY) {
         await this.ensureAuthority(authority);
         return authority;
      }
      return undefined;
   }

   /** Resolves a tenant Mongo URI from configured sources (env, vault, secrets). */
   async getTenantMongoUri(tenant_code: string): Promise<string | undefined> {
      const specificSource = await this.resolveTenantSpecificSource(tenant_code);
      const uri = await this.getValue(ConfigTemplates.MongoUri(tenant_code), specificSource);
      return uri?.trim() || undefined;
   }

   /** True when the SHARED tenant has no real Mongo URI — in-memory Mongo is used instead. */
   async usesInMemoryMongo(): Promise<boolean> {
      return !(await this.getTenantMongoUri(SHARED_TENANT_CODE));
   }

   async getTenantConfig(tenant_code: string): Promise<TenantConfig> {
      const key = `${tenant_code}`;
      let config = this.tenants.get(key);
      if (!config || !config.attempted) {
         this.logger.debug(`Resolving config for tenant: ${key}`);

         config = {
            tenant_code: tenant_code,
            attempted: true,
         };

         const specificSource = await this.resolveTenantSpecificSource(tenant_code);

         // attempt mongo config
         const database = await this.getValue(ConfigTemplates.MongoDatabase(tenant_code), specificSource);
         const uri = await this.getTenantMongoUri(tenant_code);
         const maxPoolSize = await this.getValue(ConfigTemplates.MongoMaxPoolSize(tenant_code), specificSource);
         const minPoolSize = await this.getValue(ConfigTemplates.MongoMinPoolSize(tenant_code), specificSource);

         if (uri && !database) {
            throw new Error(`Mongo URI configured but database missing for tenant: ${key}`);
         }

         if (database && uri) {
            config.mongo = {
               uri: uri,
               database: database,
               minPoolSize: parseInt(`${minPoolSize ?? '5'}`, 10),
               maxPoolSize: parseInt(`${maxPoolSize ?? '10'}`, 10),
            };

            // attempt encryption config
            const kmsProvider = await this.getValue(ConfigTemplates.KmsProvider(tenant_code), specificSource);
            // aws or blank
            if (kmsProvider == KMS_AWS) {
               const awsAccessKeyId = await this.getValue(ConfigTemplates.AwsAccessKeyId(tenant_code), specificSource);
               const awsAccessKeySecret = await this.getValue(ConfigTemplates.AwsAccessKeySecret(tenant_code), specificSource);
               const awsAccessKeySessionToken = await this.getValue(ConfigTemplates.AwsAccessKeySessionToken(tenant_code), specificSource);
               const awsKmsArn = await this.getValue(ConfigTemplates.AwsKmsArn(tenant_code), specificSource);
               const awsKmsRegion = await this.getValue(ConfigTemplates.AwsKmsRegion(tenant_code), specificSource);
               const awsKmsArnCustodian = await this.getValue(ConfigTemplates.AwsKmsArnCustodian(tenant_code), specificSource);

               if (awsAccessKeyId && awsAccessKeySecret && awsKmsArn && awsKmsRegion) {
                  config.mongo.kms_aws = {
                     accessKeyId: awsAccessKeyId,
                     secretAccessKey: awsAccessKeySecret,
                     sessionToken: awsAccessKeySessionToken,
                     kmsArn: awsKmsArn,
                     kmsRegion: awsKmsRegion,
                     kmsArnCustodian: awsKmsArnCustodian ?? '',
                  };
               } else {
                  throw new Error(`Provided KMS is requested but is missing configuration: ${tenant_code}, provider: ${kmsProvider}`);
               }
            } else if (kmsProvider == KMS_AZURE) {
               const azureTenantId = await this.getValue(ConfigTemplates.AzureTenantId(tenant_code), specificSource);
               const azureClientId = await this.getValue(ConfigTemplates.AzureClientId(tenant_code), specificSource);
               const azureClientSecret = await this.getValue(ConfigTemplates.AzureClientSecret(tenant_code), specificSource);
               const azureKeyVaultEndpoint = await this.getValue(ConfigTemplates.AzureKeyVaultEndpoint(tenant_code), specificSource);
               const azureQueryableKeyName = await this.getValue(ConfigTemplates.AzureQueryableKeyName(tenant_code), specificSource);
               const azureCustodianKeyName = await this.getValue(ConfigTemplates.AzureCustodianKeyName(tenant_code), specificSource);

               if (azureTenantId && azureClientId && azureClientSecret && azureQueryableKeyName && azureKeyVaultEndpoint && azureCustodianKeyName) {
                  config.mongo.kms_azure = {
                     tenantId: azureTenantId,
                     clientId: azureClientId,
                     clientSecret: azureClientSecret,
                     keyVaultEndpoint: azureKeyVaultEndpoint,
                     keyNameQueryable: azureQueryableKeyName,
                     keyNameCustodian: azureCustodianKeyName,
                  };
               } else {
                  throw new Error(`Provided KMS is requested but is missing configuration: ${tenant_code}, provider: ${kmsProvider}`);
               }
            } else {
               throw new Error(
                  `Tenant "${tenant_code}" specified unsupported KMS provider: "${kmsProvider}". Only "${KMS_AWS}" and "${KMS_AZURE}" are currently supported. Check configuration for ${tenant_code}_KMS_PROVIDER`
               );
            }
         }
         this.tenants.set(key, config);
      }
      if (config?.mongo) {
         return config;
      }
      if (key.toUpperCase() === SHARED_TENANT_CODE) {
         return config;
      }
      throw new Error(`No configuration found for tenant: ${key}`);
   }

   reset() {
      this.tenants.clear();
      this.initialized = false;
      this.sources.clear();
      this.defaultSources = [];
   }
}
