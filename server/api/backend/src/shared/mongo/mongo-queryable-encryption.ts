import { AutoEncryptionOptions, Binary, ClientEncryption, ClientEncryptionOptions, MongoClient, MongoClientOptions, UUID } from 'mongodb';
import { EncryptedFieldsMap } from '../types/mongo/mongo-queryable-encryption-types';
import { CollectionDefinition } from '../types/mongo/collection-definition.types';
import { ConfigResolver } from 'src/config/config.resolver';
import { TenantConfig } from 'src/config/config.types';
import { ConfigTemplates } from 'src/config/config.templates';
import * as os from 'os';

function getCryptSharedLibPath() {
   const platform = os.platform();
   switch (platform) {
   case 'win32':
      return 'mongo_crypt_v1.dll' as const;
   case 'linux':
      return 'mongo_crypt_v1.so' as const;
   default:
      throw new Error(`Unsupported platform for cryptography: ${platform}`);
   }
}

export async function ensureDataKey(configResolver: ConfigResolver, tenantConfig: TenantConfig, keyAltName: string): Promise<Binary> {
   if (!tenantConfig?.mongo?.kms_aws && !tenantConfig?.mongo?.kms_azure) {
      throw new Error(`Invalid encryption configuration found for tenant: ${tenantConfig.tenant_code}`);
   }

   const encryptionDatabase = await configResolver.getValue(ConfigTemplates.EncryptionDatabase());
   const encryptionCollection = await configResolver.getValue(ConfigTemplates.EncryptionCollection());
   if (!encryptionDatabase || !encryptionCollection) {
      throw new Error('Missing encryption database and collection');
   }

   const autoEncryptionOptions = buildAutoEncryptionOptions(tenantConfig, encryptionDatabase, encryptionCollection);

   const client = new MongoClient(tenantConfig.mongo.uri, autoEncryptionOptions);
   try {
      await client.connect();
      const options = buildEncryptionOptions(tenantConfig, encryptionDatabase, encryptionCollection);
      const clientEncryption = new ClientEncryption(client, options);

      const keyVault = client.db(encryptionDatabase).collection(encryptionCollection);
      const existing = await keyVault.findOne({ keyAltNames: keyAltName });

      if (existing) {
         if (!(existing._id instanceof Binary)) {
            throw new Error('Expected _id to be a Binary subtype 4, but it was not.');
         }
         return existing._id;
      } else {
         let dataKey: UUID;
         if (tenantConfig.mongo.kms_aws) {
            dataKey = await clientEncryption.createDataKey('aws', {
               masterKey: {
                  key: tenantConfig.mongo.kms_aws.kmsArn,
                  region: tenantConfig.mongo.kms_aws.kmsRegion,
               },
               keyAltNames: [keyAltName],
            });
         } else if (tenantConfig.mongo.kms_azure) {
            dataKey = await clientEncryption.createDataKey('azure', {
               masterKey: {
                  keyVaultEndpoint: tenantConfig.mongo.kms_azure.keyVaultEndpoint,
                  keyName: tenantConfig.mongo.kms_azure.keyNameQueryable,
               },
               keyAltNames: [keyAltName],
            });
         } else {
            throw new Error('No KMS provider configured');
         }
         // UUID extends Binary (subtype 4) at runtime
         return dataKey as unknown as Binary;
      }
   } finally {
      await client.close();
   }
}

export function buildAutoEncryptionOptions(config: TenantConfig, encryptionDatabase: string, encryptionCollection: string): MongoClientOptions {
   const encryptionOptions = buildEncryptionOptions(config, encryptionDatabase, encryptionCollection);
   return {
      autoEncryption: {
         ...encryptionOptions,
         bypassAutoEncryption: false,
         extraOptions: {
            cryptSharedLibRequired: false,
            cryptSharedLibPath: getCryptSharedLibPath(),
         },
      },
   };
}
export function buildEncryptionOptions(
   config: TenantConfig,
   encryptionDatabase: string,
   encryptionCollection: string
): AutoEncryptionOptions & ClientEncryptionOptions {
   if (!config.mongo?.kms_aws && !config.mongo?.kms_azure) {
      throw Error('Encryption Configuration Missing');
   }

   const kmsProviders: Record<string, any> = {};

   if (config.mongo.kms_aws) {
      kmsProviders.aws = {
         accessKeyId: config.mongo.kms_aws.accessKeyId,
         secretAccessKey: config.mongo.kms_aws.secretAccessKey,
         sessionToken: config.mongo.kms_aws.sessionToken,
      };
   }

   if (config.mongo.kms_azure) {
      kmsProviders.azure = {
         tenantId: config.mongo.kms_azure.tenantId,
         clientId: config.mongo.kms_azure.clientId,
         clientSecret: config.mongo.kms_azure.clientSecret,
      };
   }

   return {
      keyVaultNamespace: `${encryptionDatabase}.${encryptionCollection}`,
      kmsProviders,
   };
}
export function buildEncryptedFieldsMap(dbName: string, keyId: Binary, collections: CollectionDefinition[]): EncryptedFieldsMap {
   const map: EncryptedFieldsMap = {};

   for (const def of collections) {
      if (def.encryptedFields && def.encryptedFields.length > 0) {
         const namespace = `${dbName}.${def.name}`;
         map[namespace] = {
            fields: def.encryptedFields.map(x => ({ ...x, keyId })),
         };
      }
   }

   return map;
}
