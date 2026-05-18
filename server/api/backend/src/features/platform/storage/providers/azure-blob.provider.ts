import { Injectable } from '@nestjs/common';
import { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, ContainerSASPermissions } from '@azure/storage-blob';
import { ICloudStorageProvider } from '../types/storage.interfaces';
import { CloudStorageCredentials, UploadSignature, AccessSignature, FileMetadata } from '../types/storage.types';

@Injectable()
export class AzureBlobProvider implements ICloudStorageProvider {
   private blobServiceClient: BlobServiceClient;
   private containerName: string;
   private customDomain?: string;

   constructor(config: CloudStorageCredentials) {
      if (!config.azure) {
         throw new Error('Azure credentials are required for Azure Blob provider');
      }

      const { accountName, accountKey, containerName, customDomain } = config.azure;

      if (!accountName || !accountKey || !containerName) {
         throw new Error('Azure storage account name, key, and container name are required');
      }

      const credential = new StorageSharedKeyCredential(accountName, accountKey);
      const baseUrl = customDomain ? `https://${customDomain}` : `https://${accountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(baseUrl, credential);
      this.containerName = containerName;
      this.customDomain = customDomain;
   }

   async generateUploadSignature(key: string, contentType: string, expiresInMinutes: number = 60): Promise<UploadSignature> {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(key);

      // Azure expects UTC time for expiresOn - use setUTCMinutes as recommended by Azure docs
      const expiresOn = new Date();
      expiresOn.setUTCMinutes(expiresOn.getUTCMinutes() + expiresInMinutes);

      // Generate SAS token for upload
      const sasUrl = await blobClient.generateSasUrl({
         permissions: BlobSASPermissions.parse('w'),
         expiresOn: expiresOn,
         contentType,
      });

      return {
         url: sasUrl,
         headers: {
            'x-ms-blob-type': 'BlockBlob',
            'x-ms-blob-content-type': contentType,
         },
         expiresInMinutes: expiresInMinutes,
      };
   }

   async generatePostUploadSignature(
      _key: string,
      _contentType: string,
      _maxSizeBytes: number,
      _expiresInMinutes?: number
   ): Promise<UploadSignature> {
      throw new Error('Post-based upload signatures are not implemented for Azure Blob provider');
   }

   async generateAccessSignature(key: string, expiresInMinutes: number): Promise<AccessSignature> {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlockBlobClient(key);

      // Azure expects UTC time for expiresOn - use setUTCMinutes as recommended by Azure docs
      const expiresOn = new Date();
      expiresOn.setUTCMinutes(expiresOn.getUTCMinutes() + expiresInMinutes);

      // Generate SAS token for read access
      const sasUrl = await blobClient.generateSasUrl({
         permissions: BlobSASPermissions.parse('r'),
         expiresOn: expiresOn,
      });

      return {
         url: sasUrl,
         expiresInMinutes: expiresInMinutes,
      };
   }

   async getFileMetadata(key: string): Promise<FileMetadata | null> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         const properties = await blobClient.getProperties();

         return {
            key,
            size: properties.contentLength || 0,
            contentType: properties.contentType || 'application/octet-stream',
            lastModified: properties.lastModified || new Date(),
            etag: properties.etag,
         };
      } catch (error) {
         if (error.statusCode === 404) {
            return null;
         }
         throw error;
      }
   }

   async deleteFile(key: string): Promise<boolean> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         await blobClient.delete();
         return true;
      } catch (error) {
         if (error.statusCode === 404) {
            return false;
         }
         throw error;
      }
   }

   async fileExists(key: string): Promise<boolean> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         await blobClient.getProperties();
         return true;
      } catch (error) {
         if (error.statusCode === 404) {
            return false;
         }
         throw error;
      }
   }

   async generatePublicBucketAccessSignature(): Promise<AccessSignature> {
      // For bucket access, return the base URL without signature
      const baseUrl = this.customDomain
         ? `https://${this.customDomain}/${this.containerName}`
         : `https://${this.blobServiceClient.accountName}.blob.core.windows.net/${this.containerName}`;
      return {
         url: baseUrl,
         expiresInMinutes: 0, // No expiration for public bucket URLs
      };
   }

   async generatePrivateBucketAccessSignature(expiresInMinutes: number): Promise<AccessSignature> {
      // For bucket access, generate a container-level SAS token
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);

      // Azure expects UTC time for expiresOn - use setUTCMinutes as recommended by Azure docs
      const expiresOn = new Date();
      expiresOn.setUTCMinutes(expiresOn.getUTCMinutes() + expiresInMinutes);

      const permissions = ContainerSASPermissions.parse('r'); // Read permission

      const sasUrl = await containerClient.generateSasUrl({
         permissions,
         expiresOn: expiresOn,
      });

      return {
         url: sasUrl,
         expiresInMinutes: expiresInMinutes,
      };
   }

   combineBucketAccessWithFileKey(bucketAccessSignature: AccessSignature, fileKey: string): string {
      const baseUrl = bucketAccessSignature.url;

      // For Azure SAS URLs, insert the file key before the query parameters
      // The SAS token query parameters must come after the file path
      if (baseUrl.includes('?')) {
         const [basePath, queryParams] = baseUrl.split('?', 2);
         return `${basePath}/${fileKey}?${queryParams}`;
      }

      // If no query parameters, just append the file key
      return `${baseUrl}/${fileKey}`;
   }

   async makeFilePublic(key: string): Promise<boolean> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         // Azure Blob Storage doesn't support making individual blobs public when the container is private.
         // The blob will only be publicly accessible if the container itself is set to public access.
         // However, we can still attempt to set the blob's access tier and properties.
         // Note: This will only work if the container allows public access.

         // Check if blob exists first
         const exists = await blobClient.exists();
         if (!exists) {
            return false;
         }

         // Note: Azure Blob Storage doesn't support per-blob public access when the container is private.
         // Unlike S3, Azure only supports container-level public access settings.
         // To make a blob publicly accessible, the container itself must be configured for public access.
         // This method verifies the blob exists, but cannot actually change its public/private status.
         // The actual public access is controlled by the container's access policy.

         // No operation needed - just verify blob exists
         // The blob's accessibility is determined by the container's public access setting
         return true;
      } catch (error) {
         // If blob doesn't exist, return false
         if (error.statusCode === 404) {
            return false;
         }
         // Re-throw other errors
         throw error;
      }
   }

   getPublicUrl(key: string): string {
      // Note: This URL will only work if the container is configured for public access
      if (this.customDomain) {
         return `https://${this.customDomain}/${this.containerName}/${key}`;
      }
      return `https://${this.blobServiceClient.accountName}.blob.core.windows.net/${this.containerName}/${key}`;
   }

   async downloadFileHead(key: string, bytes: number): Promise<Buffer | null> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         const downloadResponse = await blobClient.download(0, bytes);
         const chunks: Buffer[] = [];

         if (downloadResponse.readableStreamBody) {
            for await (const chunk of downloadResponse.readableStreamBody) {
               chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
         }

         return Buffer.concat(chunks);
      } catch (error) {
         if (error.statusCode === 404) {
            return null;
         }
         throw error;
      }
   }

   async downloadFile(key: string): Promise<Buffer | null> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         const downloadResponse = await blobClient.download(0);
         const chunks: Buffer[] = [];

         if (downloadResponse.readableStreamBody) {
            for await (const chunk of downloadResponse.readableStreamBody) {
               chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
         }

         return Buffer.concat(chunks);
      } catch (error) {
         if (error.statusCode === 404) {
            return null;
         }
         throw error;
      }
   }

   async uploadFile(key: string, data: Buffer, contentType: string): Promise<boolean> {
      try {
         const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
         const blobClient = containerClient.getBlockBlobClient(key);

         await blobClient.uploadData(data, {
            blobHTTPHeaders: {
               blobContentType: contentType,
            },
         });

         return true;
      } catch (error) {
         throw error;
      }
   }
}
