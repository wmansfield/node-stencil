// @ts-nocheck
import { ConfigResolver } from './config.resolver';
import { ConfigTemplates } from './config.templates';
import { IConfigSource } from './config.types';

describe('ConfigResolver', () => {
   let resolver: ConfigResolver;

   const mockEnvSource: IConfigSource = {
      name: 'env',
      getValue: jest.fn(async (key: string) => {
         if (key === 'ALPHA_KMS_PROVIDER') return 'aws';
         if (key === 'ALPHA_MONGO_URI') return 'mongodb://env-uri';
         if (key === 'ALPHA_MONGO_DATABASE') return 'env-db';
         if (key === 'ALPHA_AWS_ACCESS_KEY_ID') return 'env-key-id';
         if (key === 'ALPHA_AWS_ACCESS_KEY_SECRET') return 'env-key-secret';
         if (key === 'ALPHA_AWS_KMS_ARN') return 'env-fake-path';
         if (key === 'ALPHA_AWS_KMS_REGION') return 'env-us-east-x';
         if (key === 'ALPHA_AWS_ACCESS_SESSION_TOKEN') return '';
         return undefined;
      }),
   };

   beforeEach(() => {
      resolver = new ConfigResolver();
      // Directly inject mock source
      (resolver as any).sources.set(mockEnvSource.name, mockEnvSource);
      (resolver as any).defaultSources.push(mockEnvSource);
      (resolver as any).initialized = true;
   });

   afterEach(() => {
      resolver.reset();
      jest.clearAllMocks();
   });

   it('should initialize successfully', async () => {
      resolver.reset();
      await resolver.init();
   });

   it('should resolve basic tenant config from environment source', async () => {
      const config = await resolver.getTenantConfig('ALPHA');

      expect(config.mongo).toBeDefined();
      expect(config.mongo.uri).toBe('mongodb://env-uri');
      expect(config.mongo.database).toBe('env-db');
   });

   it('should throw if no config exists for tenant', async () => {
      const badKeySource: IConfigSource = {
         name: 'env',
         getValue: jest.fn(() => undefined),
      };

      resolver.reset();
      (resolver as any).sources.set(badKeySource.name, badKeySource);
      (resolver as any).defaultSources.push(badKeySource);
      (resolver as any).initialized = true;

      await expect(resolver.getTenantConfig('missing')).rejects.toThrow('No configuration found for tenant: missing');
   });

   it('should resolve config using a vault over environment', async () => {
      const vaultSource: IConfigSource = {
         name: 'ALPHA',
         getValue: jest.fn(async (key: string) => {
            if (key === 'ALPHA_KMS_PROVIDER') return 'aws';
            if (key === 'ALPHA_MONGO_URI') return 'mongodb://vault-uri';
            if (key === 'ALPHA_MONGO_DATABASE') return 'vault-db';
            if (key === 'ALPHA_AWS_ACCESS_KEY_ID') return 'vault-key-id';
            if (key === 'ALPHA_AWS_ACCESS_KEY_SECRET') return 'vault-key-secret';
            if (key === 'ALPHA_AWS_KMS_ARN') return 'vault-fake-path';
            if (key === 'ALPHA_AWS_KMS_REGION') return 'vault-us-east-x';
            return undefined;
         }),
      };

      (resolver as any).defaultSources.unshift(vaultSource);

      const config = await resolver.getTenantConfig('ALPHA');
      expect(config.mongo.uri).toBe('mongodb://vault-uri');
      expect(config.mongo.database).toBe('vault-db');
   });

   it('should resolve config using a specific authority vault source', async () => {
      const vaultSource: IConfigSource = {
         name: 'BETA',
         getValue: jest.fn(async (key: string) => {
            if (key === 'BETA_KMS_PROVIDER') return 'aws';
            if (key === 'BETA_MONGO_URI') return 'mongodb://beta-uri';
            if (key === 'BETA_MONGO_DATABASE') return 'beta-db';
            if (key === 'BETA_AWS_ACCESS_KEY_ID') return 'beta-key-id';
            if (key === 'BETA_AWS_ACCESS_KEY_SECRET') return 'beta-key-secret';
            if (key === 'BETA_AWS_KMS_ARN') return 'beta-fake-path';
            if (key === 'BETA_AWS_KMS_REGION') return 'beta-us-east-x';
            return undefined;
         }),
      };

      (resolver as any).sources.set('BETA', vaultSource);

      // Spy so we override getValue to simulate authority
      jest.spyOn(resolver, 'getValue').mockImplementation((key: string) => {
         return vaultSource.getValue(key);
      });

      const config = await resolver.getTenantConfig('BETA');
      expect(config.mongo.uri).toBe('mongodb://beta-uri');
      expect(config.mongo.database).toBe('beta-db');
   });

   it('should throw if KMS config is incomplete', async () => {
      const partialKmsSource: IConfigSource = {
         name: 'env',
         getValue: jest.fn(async (key: string) => {
            if (key.includes('KMS_ARN')) return undefined; // missing!

            if (key === 'ALPHA_KMS_PROVIDER') return 'aws';
            if (key === 'ALPHA_MONGO_URI') return 'mongodb://env-uri';
            if (key === 'ALPHA_MONGO_DATABASE') return 'env-db';
            if (key === 'ALPHA_AWS_ACCESS_KEY_ID') return 'env-key-id';
            if (key === 'ALPHA_AWS_ACCESS_KEY_SECRET') return 'env-key-secret';
            if (key === 'ALPHA_AWS_KMS_ARN') return 'env-fake-path';
            if (key === 'ALPHA_AWS_KMS_REGION') return 'env-us-east-x';
            return undefined;
         }),
      };

      resolver.reset();
      (resolver as any).sources.set(partialKmsSource.name, partialKmsSource);
      (resolver as any).defaultSources.push(partialKmsSource);
      (resolver as any).initialized = true;

      await expect(resolver.getTenantConfig('alpha')).rejects.toThrow('Provided KMS is requested but is missing configuration: alpha, provider: aws');
   });

   it('should return SHARED tenant config without mongo in sample environment', async () => {
      const sampleSource: IConfigSource = {
         name: 'env',
         getValue: jest.fn(async (key: string) => {
            if (key === 'SHARED_MONGO_DATABASE') return 'Shared';
            return undefined;
         }),
      };

      resolver.reset();
      (resolver as any).sources.set(sampleSource.name, sampleSource);
      (resolver as any).defaultSources.push(sampleSource);
      (resolver as any).initialized = true;

      expect(await resolver.usesInMemoryMongo()).toBe(true);

      const config = await resolver.getTenantConfig('SHARED');
      expect(config.tenant_code).toBe('SHARED');
      expect(config.mongo).toBeUndefined();
   });

   it('should use real mongo when SHARED tenant URI is configured', async () => {
      const prodSource: IConfigSource = {
         name: 'env',
         getValue: jest.fn(async (key: string) => {
            if (key === 'SHARED_KMS_PROVIDER') return 'aws';
            if (key === 'SHARED_MONGO_URI') return 'mongodb://shared-uri';
            if (key === 'SHARED_MONGO_DATABASE') return 'Shared';
            if (key === 'SHARED_AWS_ACCESS_KEY_ID') return 'shared-key-id';
            if (key === 'SHARED_AWS_ACCESS_KEY_SECRET') return 'shared-key-secret';
            if (key === 'SHARED_AWS_KMS_ARN') return 'shared-fake-path';
            if (key === 'SHARED_AWS_KMS_REGION') return 'shared-us-east-x';
            return undefined;
         }),
      };

      resolver.reset();
      (resolver as any).sources.set(prodSource.name, prodSource);
      (resolver as any).defaultSources.push(prodSource);
      (resolver as any).initialized = true;

      expect(await resolver.usesInMemoryMongo()).toBe(false);

      const config = await resolver.getTenantConfig('SHARED');
      expect(config.mongo?.uri).toBe('mongodb://shared-uri');
   });
});
