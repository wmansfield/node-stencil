import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MemoryCache } from 'src/shared/cache/memory-cache';
import {
   UploadSignature,
   AccessSignature,
   FileMetadata,
   StorageConfig,
   STORAGE_TTL_CONSTANTS,
   CloudStorageCredentials,
} from '../types/storage.types';
import { EntityRegistry } from 'src/entities/entity.registry';
import { ConfigResolver } from 'src/config/config.resolver';
import { ConfigTemplates } from 'src/config/config.templates';
import { AzureBlobProvider } from '../providers/azure-blob.provider';
import { AwsS3Provider } from '../providers/aws-s3.provider';
import { GoogleCloudStorageProvider } from '../providers/google-cloud-storage.provider';
import { ICloudStorageProvider } from '../types/storage.interfaces';

//TODO:MUST:File Type Verification
// After upload, the content type can be anything, should download the file and verify its contents are not bad
@Injectable()
export class CloudStorageHandler {
   private readonly logger = new Logger(CloudStorageHandler.name);

   constructor(
      private readonly memoryCache: MemoryCache,
      private readonly entities: EntityRegistry,
      private readonly configResolver: ConfigResolver
   ) {}

   async generateUploadSignature(jurisdiction_id: string, filePath: string, contentType: string): Promise<UploadSignature> {
      const provider = await this.resolveProviderCached(jurisdiction_id);
      return await provider.generateUploadSignature(filePath, contentType, STORAGE_TTL_CONSTANTS.UPLOAD_SIGNATURE_MINUTES);
   }

   async generatePostUploadSignature(jurisdiction_id: string, filePath: string, contentType: string, maxSizeBytes: number): Promise<UploadSignature> {
      const provider = await this.resolveProviderCached(jurisdiction_id);
      return await provider.generatePostUploadSignature(filePath, contentType, maxSizeBytes, STORAGE_TTL_CONSTANTS.UPLOAD_SIGNATURE_MINUTES);
   }

   async generateFileAccessSignatureSingle(tenant_code: string, filePath: string): Promise<AccessSignature> {
      const provider = await this.resolveProviderCached(tenant_code);
      const cacheKey = `CloudStorageHandler:access_signature:${tenant_code}:${filePath}`;
      const result = await this.memoryCache.getOrFetch15<AccessSignature>(cacheKey, async (): Promise<AccessSignature> => {
         return await provider.generateAccessSignature(filePath, STORAGE_TTL_CONSTANTS.ACCESS_SIGNATURE_MINUTES);
      });

      return result.value;
   }
   async generateFileAccessSignatureBucket(tenantCode: string, fileKey: string): Promise<string> {
      const provider = await this.resolveProviderCached(tenantCode);
      const bucketSignature = await this.generateBucketAccessSignatureCached(tenantCode);
      return provider.combineBucketAccessWithFileKey(bucketSignature, fileKey);
   }

   async getStorageConfigCached(tenantCode: string): Promise<StorageConfig | undefined> {
      const cacheKey = `getStorageConfigCached:${tenantCode}`;

      const fetchConfig = async (): Promise<StorageConfig | undefined> => {
         try {
            const maxFileSize = await this.configResolver.getValue(ConfigTemplates.StorageMaxFileSize(tenantCode));
            const allowedContentTypes = await this.configResolver.getValue(ConfigTemplates.StorageAllowedContentTypes(tenantCode));
            const allowedFileExtensions = await this.configResolver.getValue(ConfigTemplates.StorageAllowedFileExtensions(tenantCode));
            const storageProvider = await this.configResolver.getValue(ConfigTemplates.StorageProvider(tenantCode));

            // Validate required configurations
            if (!storageProvider || !['azure', 'aws', 'gcs'].includes(storageProvider)) {
               this.logger.error(`Invalid or missing storage provider for tenant ${tenantCode}: ${storageProvider}`);
               return undefined;
            }

            const parsedMaxFileSize = parseInt(maxFileSize || '10485760');
            if (isNaN(parsedMaxFileSize) || parsedMaxFileSize <= 0) {
               this.logger.error(`Invalid max file size for tenant ${tenantCode}: ${maxFileSize}`);
               return undefined;
            }

            return {
               tenantCode: tenantCode,
               maxFileSize: parsedMaxFileSize,
               allowedContentTypes: (
                  allowedContentTypes ||
                  'image/jpeg,image/png,image/gif,image/webp,audio/mp4,audio/m4a,audio/mpeg,audio/wav,audio/wave,audio/aac,audio/ogg,audio/x-caf'
               ).split(','),
               allowedFileExtensions: (allowedFileExtensions || '.jpeg,.jpg,.png,.gif,.webp,.m4a,.mp3,.wav,.aac,.ogg,.caf').split(','),
               storageProvider: storageProvider as 'azure' | 'aws' | 'gcs',
            };
         } catch (error) {
            this.logger.error(`Error fetching storage configuration for tenant ${tenantCode}:`, error);
            return undefined;
         }
      };

      try {
         const result = await this.memoryCache.getOrFetch15<StorageConfig | undefined>(cacheKey, fetchConfig);
         return result.value;
      } catch (error) {
         this.logger.error(`Error retrieving cached storage configuration for tenant ${tenantCode}:`, error);
         return undefined;
      }
   }

   async downloadFileHead(tenantCode: string, filePath: string, bytes: number): Promise<Buffer | null> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.downloadFileHead(filePath, bytes);
   }

   async getFileMetadata(tenantCode: string, filePath: string): Promise<FileMetadata | null> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.getFileMetadata(filePath);
   }

   async deleteFile(tenantCode: string, filePath: string): Promise<boolean> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.deleteFile(filePath);
   }

   async fileExists(tenantCode: string, filePath: string): Promise<boolean> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.fileExists(filePath);
   }

   async makeFilePublic(tenantCode: string, file_key: string): Promise<boolean> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.makeFilePublic(file_key);
   }

   async getPublicUrl(tenantCode: string, file_key: string): Promise<string> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.getPublicUrl(file_key);
   }

   async downloadFile(tenantCode: string, filePath: string): Promise<Buffer | null> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.downloadFile(filePath);
   }

   async uploadFile(tenantCode: string, filePath: string, data: Buffer, contentType: string): Promise<boolean> {
      const provider = await this.resolveProviderCached(tenantCode);
      return provider.uploadFile(filePath, data, contentType);
   }

   protected async generateBucketAccessSignatureCached(tenantCode: string): Promise<AccessSignature> {
      const provider = await this.resolveProviderCached(tenantCode);
      const cacheKey = `CloudStorageHandler:bucket_signature:${tenantCode}`;

      // warning: getOrFetch15 is expected as the STORAGE_TTL_CONSTANTS.ACCESS_SIGNATURE_MINUTES is set to 30 minutes. use caution changing
      const result = await this.memoryCache.getOrFetch15<AccessSignature>(cacheKey, async (): Promise<AccessSignature> => {
         return await provider.generatePrivateBucketAccessSignature(STORAGE_TTL_CONSTANTS.ACCESS_SIGNATURE_MINUTES);
      });
      return result.value;
   }

   protected async resolveProviderCached(tenantCode: string): Promise<ICloudStorageProvider> {
      const cached = await this.memoryCache.getOrFetch15(`CloudStorageHandler:resolveProviderCached:${tenantCode}`, async () => {
         const provider = await this.createProvider(tenantCode);
         if (!provider) {
            throw new BadRequestException(`Unable to resolve storage provider for tenant: ${tenantCode}`);
         }
         return provider;
      });
      return cached.value;
   }

   protected async createProvider(tenantCode: string): Promise<ICloudStorageProvider | undefined> {
      try {
         const cloudCredentials = await this.getCloudStorageCredentialsCached(tenantCode);

         if (!cloudCredentials) {
            this.logger.error(`Failed to get cloud storage credentials for tenant: ${tenantCode}`);
            return undefined;
         }

         if (cloudCredentials.provider === 'azure') {
            return new AzureBlobProvider(cloudCredentials);
         } else if (cloudCredentials.provider === 'aws') {
            return new AwsS3Provider(cloudCredentials);
         } else if (cloudCredentials.provider === 'gcs') {
            return new GoogleCloudStorageProvider(cloudCredentials);
         } else {
            this.logger.error(`Unsupported storage provider: ${cloudCredentials.provider} for tenant: ${tenantCode}`);
            return undefined;
         }
      } catch (error) {
         this.logger.error(`Error creating storage provider for tenant ${tenantCode}:`, error);
         return undefined;
      }
   }

   protected async getCloudStorageCredentialsCached(tenantCode: string): Promise<CloudStorageCredentials | undefined> {
      const cacheKey = `getCloudStorageCredentialsCached:${tenantCode}`;

      const fetchConfig = async (): Promise<CloudStorageCredentials | undefined> => {
         try {
            const provider = (await this.configResolver.getValue(ConfigTemplates.StorageProvider(tenantCode))) || 'azure';

            if (provider === 'azure') {
               const accountName = await this.configResolver.getValue(ConfigTemplates.StorageAzureAccountName(tenantCode));
               const accountKey = await this.configResolver.getValue(ConfigTemplates.StorageAzureAccountKey(tenantCode));
               const containerName = await this.configResolver.getValue(ConfigTemplates.StorageAzureContainerName(tenantCode));

               if (!accountName || !accountKey || !containerName) {
                  this.logger.error(
                     `Missing required Azure storage configuration for tenant ${tenantCode}: accountName=${!!accountName}, accountKey=${!!accountKey}, containerName=${!!containerName}`
                  );
                  return undefined;
               }

               return {
                  provider: 'azure',
                  azure: {
                     accountName,
                     accountKey,
                     containerName,
                     customDomain: (await this.configResolver.getValue(ConfigTemplates.StorageAzureCustomDomain(tenantCode))) || undefined,
                  },
               };
            } else if (provider === 'aws') {
               const accessKeyId = await this.configResolver.getValue(ConfigTemplates.StorageAwsAccessKeyId(tenantCode));
               const secretAccessKey = await this.configResolver.getValue(ConfigTemplates.StorageAwsAccessKeySecret(tenantCode));
               const region = await this.configResolver.getValue(ConfigTemplates.StorageAwsRegion(tenantCode));
               const bucketName = await this.configResolver.getValue(ConfigTemplates.StorageAwsBucketName(tenantCode));

               if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
                  this.logger.error(
                     `Missing required AWS storage configuration for tenant ${tenantCode}: accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}, region=${!!region}, bucketName=${!!bucketName}`
                  );
                  return undefined;
               }

               return {
                  provider: 'aws',
                  aws: {
                     accessKeyId,
                     secretAccessKey,
                     region,
                     bucketName,
                     cloudFrontDomain: (await this.configResolver.getValue(ConfigTemplates.StorageAwsCloudFrontDomain(tenantCode))) || undefined,
                     cloudFrontKeyPairId:
                        (await this.configResolver.getValue(ConfigTemplates.StorageAwsCloudFrontKeyPairId(tenantCode))) || undefined,
                     cloudFrontPrivateKey:
                        (await this.configResolver.getValue(ConfigTemplates.StorageAwsCloudFrontPrivateKey(tenantCode))) || undefined,
                  },
               };
            } else if (provider === 'gcs') {
               const projectId = await this.configResolver.getValue(ConfigTemplates.StorageGcsProjectId(tenantCode));
               const privateKey = await this.configResolver.getValue(ConfigTemplates.StorageGcsPrivateKey(tenantCode));
               const clientEmail = await this.configResolver.getValue(ConfigTemplates.StorageGcsClientEmail(tenantCode));
               const bucketName = await this.configResolver.getValue(ConfigTemplates.StorageGcsBucketName(tenantCode));

               if (!projectId || !privateKey || !clientEmail || !bucketName) {
                  this.logger.error(
                     `Missing required GCS storage configuration for tenant ${tenantCode}: projectId=${!!projectId}, privateKey=${!!privateKey}, clientEmail=${!!clientEmail}, bucketName=${!!bucketName}`
                  );
                  return undefined;
               }

               return {
                  provider: 'gcs',
                  gcs: {
                     projectId,
                     privateKey,
                     clientEmail,
                     bucketName,
                     customDomain: (await this.configResolver.getValue(ConfigTemplates.StorageGcsCustomDomain(tenantCode))) || undefined,
                  },
               };
            } else {
               this.logger.error(`Unsupported storage provider: ${provider} for tenant: ${tenantCode}`);
               return undefined;
            }
         } catch (error) {
            this.logger.error(`Error fetching cloud storage configuration for tenant ${tenantCode}:`, error);
            return undefined;
         }
      };

      try {
         const result = await this.memoryCache.getOrFetch15<CloudStorageCredentials | undefined>(cacheKey, fetchConfig);
         return result.value;
      } catch (error) {
         this.logger.error(`Error retrieving cached cloud storage configuration for tenant ${tenantCode}:`, error);
         return undefined;
      }
   }
}
