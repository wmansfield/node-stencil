import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ICloudStorageProvider } from '../types/storage.interfaces';
import { CloudStorageCredentials, UploadSignature, AccessSignature, FileMetadata } from '../types/storage.types';

@Injectable()
export class GoogleCloudStorageProvider implements ICloudStorageProvider {
   private storage: Storage;
   private bucketName: string;
   private customDomain?: string;

   constructor(config: CloudStorageCredentials) {
      if (!config.gcs) {
         throw new Error('Google Cloud Storage credentials are required for GCS provider');
      }

      const { projectId, privateKey, clientEmail, bucketName, customDomain } = config.gcs;

      if (!projectId || !privateKey || !clientEmail || !bucketName) {
         throw new Error('Google Cloud Storage project ID, private key, client email, and bucket name are required');
      }

      // Create service account credentials
      const credentials = {
         type: 'service_account',
         project_id: projectId,
         private_key: privateKey.replace(/\\n/g, '\n'),
         client_email: clientEmail,
      };

      this.storage = new Storage({
         projectId,
         credentials,
      });

      this.bucketName = bucketName;
      this.customDomain = customDomain;
   }

   async generateUploadSignature(key: string, contentType: string, expiresInMinutes: number = 60): Promise<UploadSignature> {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      const expiresInSeconds = expiresInMinutes * 60;
      const [signedUrl] = await file.getSignedUrl({
         version: 'v4',
         action: 'write',
         expires: Date.now() + expiresInSeconds * 1000,
         contentType,
      });

      return {
         url: signedUrl,
         expiresInMinutes: expiresInMinutes,
      };
   }

   async generatePostUploadSignature(
      _key: string,
      _contentType: string,
      _maxSizeBytes: number,
      _expiresInMinutes?: number
   ): Promise<UploadSignature> {
      throw new Error('Post-based upload signatures are not implemented for Google Cloud Storage provider');
   }

   async generateAccessSignature(key: string, expiresInMinutes: number): Promise<AccessSignature> {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      const expiresInSeconds = expiresInMinutes * 60;
      const [signedUrl] = await file.getSignedUrl({
         version: 'v4',
         action: 'read',
         expires: Date.now() + expiresInSeconds * 1000,
      });

      return {
         url: signedUrl,
         expiresInMinutes: expiresInMinutes,
      };
   }

   async generatePublicBucketAccessSignature(): Promise<AccessSignature> {
      // For bucket access, return the base URL without signature
      const baseUrl = this.customDomain ? `https://${this.customDomain}/${this.bucketName}` : `https://storage.googleapis.com/${this.bucketName}`;
      return {
         url: baseUrl,
         expiresInMinutes: 0, // No expiration for bucket URLs
      };
   }

   async generatePrivateBucketAccessSignature(expiresInMinutes: number): Promise<AccessSignature> {
      // For bucket access, GCS doesn't support true bucket-level signed URLs
      // Instead, we'll return a base URL that can be used with individual file signed URLs
      const baseUrl = this.customDomain ? `https://${this.customDomain}/${this.bucketName}` : `https://storage.googleapis.com/${this.bucketName}`;

      return {
         url: baseUrl,
         expiresInMinutes: expiresInMinutes,
      };
   }

   async getFileMetadata(key: string): Promise<FileMetadata | null> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         const [metadata] = await file.getMetadata();

         return {
            key,
            size: parseInt(String(metadata.size || '0')),
            contentType: metadata.contentType || 'application/octet-stream',
            lastModified: new Date(metadata.updated || metadata.timeCreated || Date.now()),
            etag: metadata.etag,
         };
      } catch (error) {
         if (error.code === 404) {
            return null;
         }
         throw error;
      }
   }

   async deleteFile(key: string): Promise<boolean> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         await file.delete();
         return true;
      } catch (error) {
         if (error.code === 404) {
            return false;
         }
         throw error;
      }
   }

   async fileExists(key: string): Promise<boolean> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         const [exists] = await file.exists();
         return exists;
      } catch (error) {
         return false;
      }
   }

   combineBucketAccessWithFileKey(bucketAccessSignature: AccessSignature, fileKey: string): string {
      const baseUrl = bucketAccessSignature.url;

      // For GCS URLs, append the file key to the base URL
      return `${baseUrl}/${fileKey}`;
   }

   async makeFilePublic(key: string): Promise<boolean> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         // Check if file exists first
         const [exists] = await file.exists();
         if (!exists) {
            return false;
         }

         // Make the file publicly accessible
         await file.makePublic();
         return true;
      } catch (error) {
         // If file doesn't exist, return false
         if (error.code === 404) {
            return false;
         }
         // Re-throw other errors
         throw error;
      }
   }

   getPublicUrl(key: string): string {
      // If custom domain is configured, use it
      if (this.customDomain) {
         return `https://${this.customDomain}/${key}`;
      }
      // Otherwise use standard GCS public URL
      return `https://storage.googleapis.com/${this.bucketName}/${key}`;
   }

   async downloadFileHead(key: string, bytes: number): Promise<Buffer | null> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         const [contents] = await file.download({ start: 0, end: bytes - 1 });
         return contents;
      } catch (error) {
         if (error.code === 404) {
            return null;
         }
         throw error;
      }
   }

   async downloadFile(key: string): Promise<Buffer | null> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         const [contents] = await file.download();
         return contents;
      } catch (error) {
         if (error.code === 404) {
            return null;
         }
         throw error;
      }
   }

   async uploadFile(key: string, data: Buffer, contentType: string): Promise<boolean> {
      try {
         const bucket = this.storage.bucket(this.bucketName);
         const file = bucket.file(key);

         await file.save(data, {
            contentType,
            resumable: false,
         });

         return true;
      } catch (error) {
         throw error;
      }
   }
}
