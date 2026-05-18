import { Injectable } from '@nestjs/common';
import {
   S3Client,
   GetObjectCommand,
   HeadObjectCommand,
   DeleteObjectCommand,
   PutObjectCommand,
   ListObjectsV2Command,
   PutObjectAclCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { ICloudStorageProvider } from '../types/storage.interfaces';
import { CloudStorageCredentials, UploadSignature, AccessSignature, FileMetadata } from '../types/storage.types';
import * as crypto from 'crypto';

@Injectable()
export class AwsS3Provider implements ICloudStorageProvider {
   private s3Client: S3Client;
   private bucketName: string;
   private region: string;
   private cloudFrontDomain?: string;
   private cloudFrontKeyPairId?: string;
   private cloudFrontPrivateKey?: string;

   constructor(config: CloudStorageCredentials) {
      if (!config.aws) {
         throw new Error('AWS credentials are required for AWS S3 provider');
      }

      const { accessKeyId, secretAccessKey, region, bucketName, cloudFrontDomain, cloudFrontKeyPairId, cloudFrontPrivateKey } = config.aws;

      if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
         throw new Error('AWS access key ID, secret access key, region, and bucket name are required');
      }

      this.s3Client = new S3Client({
         region,
         credentials: {
            accessKeyId,
            secretAccessKey,
         },
      });
      this.bucketName = bucketName;
      this.region = region;
      this.cloudFrontDomain = cloudFrontDomain;
      this.cloudFrontKeyPairId = cloudFrontKeyPairId;
      // Transform escaped newlines from env file to actual newlines
      // PEM keys in .env files use literal \n instead of actual newlines
      this.cloudFrontPrivateKey = cloudFrontPrivateKey?.replace(/\\n/g, '\n');
   }

   async generateUploadSignature(key: string, contentType: string, expiresInMinutes: number = 60): Promise<UploadSignature> {
      const command = new PutObjectCommand({
         Bucket: this.bucketName,
         Key: key,
         ContentType: contentType,
      });

      const expiresInSeconds = expiresInMinutes * 60;
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });

      return {
         url: uploadUrl,
         fields: {
            'Content-Type': contentType,
         },
         expiresInMinutes: expiresInMinutes,
      };
   }

   async generatePostUploadSignature(
      key: string,
      contentType: string,
      maxSizeBytes: number,
      expiresInMinutes: number = 60
   ): Promise<UploadSignature> {
      const expiresInSeconds = expiresInMinutes * 60;

      const { url, fields } = await createPresignedPost(this.s3Client, {
         Bucket: this.bucketName,
         Key: key,
         Conditions: [
            ['content-length-range', 0, maxSizeBytes],
            ['eq', '$Content-Type', contentType],
         ],
         Fields: {
            'Content-Type': contentType,
         },
         Expires: expiresInSeconds,
      });

      return {
         url,
         fields,
         expiresInMinutes,
      };
   }

   async generateAccessSignature(key: string, expiresInMinutes: number): Promise<AccessSignature> {
      const expiresInSeconds = expiresInMinutes * 60;

      // For CloudFront, use CloudFront signed URLs
      if (this.cloudFrontDomain && this.cloudFrontKeyPairId && this.cloudFrontPrivateKey) {
         const cloudFrontUrl = `https://${this.cloudFrontDomain}/${key}`;
         const signedUrl = this.generateCloudFrontSignedUrl(cloudFrontUrl, expiresInSeconds);

         return {
            url: signedUrl,
            expiresInMinutes: expiresInMinutes,
         };
      }

      // Fallback to S3 presigned URLs
      const command = new GetObjectCommand({
         Bucket: this.bucketName,
         Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });

      return {
         url,
         expiresInMinutes: expiresInMinutes,
      };
   }

   async getFileMetadata(key: string): Promise<FileMetadata | null> {
      try {
         const command = new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
         });

         const response = await this.s3Client.send(command);

         return {
            key,
            size: response.ContentLength || 0,
            contentType: response.ContentType || 'application/octet-stream',
            lastModified: response.LastModified || new Date(),
            etag: response.ETag,
         };
      } catch (error) {
         if (error.name === 'NotFound') {
            return null;
         }
         throw error;
      }
   }

   async deleteFile(key: string): Promise<boolean> {
      try {
         const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
         });

         await this.s3Client.send(command);
         return true;
      } catch (error) {
         if (error.name === 'NotFound') {
            return false;
         }
         throw error;
      }
   }

   async fileExists(key: string): Promise<boolean> {
      try {
         const command = new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
         });

         await this.s3Client.send(command);
         return true;
      } catch (error) {
         if (error.name === 'NotFound') {
            return false;
         }
         throw error;
      }
   }

   async generatePublicBucketAccessSignature(): Promise<AccessSignature> {
      // For bucket access, return the base URL without signature
      const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
      return {
         url: baseUrl,
         expiresInMinutes: 0, // No expiration for public bucket URLs
      };
   }

   async generatePrivateBucketAccessSignature(expiresInMinutes: number): Promise<AccessSignature> {
      const expiresInSeconds = expiresInMinutes * 60;

      // If CloudFront is configured, use it for bucket-level access
      if (this.cloudFrontDomain && this.cloudFrontKeyPairId && this.cloudFrontPrivateKey) {
         const cloudFrontUrl = `https://${this.cloudFrontDomain}`;
         const signedUrl = this.generateCloudFrontSignedUrl(cloudFrontUrl, expiresInSeconds);

         return {
            url: signedUrl,
            expiresInMinutes: expiresInMinutes,
         };
      }

      // Fallback to S3 direct access (limited functionality)
      const baseUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;

      return {
         url: baseUrl,
         expiresInMinutes: expiresInMinutes,
      };
   }

   private generateCloudFrontSignedUrl(url: string, expiresIn: number): string {
      if (!this.cloudFrontKeyPairId || !this.cloudFrontPrivateKey) {
         throw new Error('CloudFront key pair ID and private key are required for signed URLs');
      }

      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
      const policy = JSON.stringify({
         Statement: [
            {
               Resource: url,
               Condition: {
                  DateLessThan: {
                     'AWS:EpochTime': expiresAt,
                  },
               },
            },
         ],
      });

      const signature = crypto.createSign('RSA-SHA1').update(policy).sign(this.cloudFrontPrivateKey, 'base64');

      const params = new URLSearchParams({
         'Key-Pair-Id': this.cloudFrontKeyPairId,
         Expires: expiresAt.toString(),
         Signature: signature,
      });

      return `${url}?${params.toString()}`;
   }

   combineBucketAccessWithFileKey(bucketAccessSignature: AccessSignature, fileKey: string): string {
      const baseUrl = bucketAccessSignature.url;

      // For CloudFront URLs with query parameters, insert the file key before the query params
      if (baseUrl.includes('?')) {
         const [basePath, queryParams] = baseUrl.split('?', 2);
         return `${basePath}/${fileKey}?${queryParams}`;
      }

      // For simple base URLs, just append the file key
      return `${baseUrl}/${fileKey}`;
   }
   async makeFilePublic(key: string): Promise<boolean> {
      try {
         const command = new PutObjectAclCommand({
            Bucket: this.bucketName,
            Key: key,
            ACL: 'public-read',
         });

         await this.s3Client.send(command);
         return true;
      } catch (error) {
         // If file doesn't exist, return false
         if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
            return false;
         }
         // Re-throw other errors
         throw error;
      }
   }

   getPublicUrl(key: string): string {
      // Use CloudFront if configured - avatar paths have a separate cache behavior
      // that doesn't require signed URLs (public via S3 ACL)
      if (this.cloudFrontDomain) {
         return `https://${this.cloudFrontDomain}/${key}`;
      }
      // Fallback to direct S3 URL
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
   }

   async downloadFileHead(key: string, bytes: number): Promise<Buffer | null> {
      try {
         const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Range: `bytes=0-${bytes - 1}`,
         });

         const response = await this.s3Client.send(command);

         if (!response.Body) {
            return null;
         }

         const chunks: Buffer[] = [];
         const stream = response.Body as NodeJS.ReadableStream;

         for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }

         return Buffer.concat(chunks);
      } catch (error) {
         if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
            return null;
         }
         throw error;
      }
   }

   async downloadFile(key: string): Promise<Buffer | null> {
      try {
         const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
         });

         const response = await this.s3Client.send(command);

         if (!response.Body) {
            return null;
         }

         // Convert the readable stream to a buffer
         const chunks: Buffer[] = [];
         const stream = response.Body as NodeJS.ReadableStream;

         for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }

         return Buffer.concat(chunks);
      } catch (error) {
         if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
            return null;
         }
         throw error;
      }
   }

   async uploadFile(key: string, data: Buffer, contentType: string): Promise<boolean> {
      try {
         const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: data,
            ContentType: contentType,
         });

         await this.s3Client.send(command);
         return true;
      } catch (error) {
         throw error;
      }
   }
}
