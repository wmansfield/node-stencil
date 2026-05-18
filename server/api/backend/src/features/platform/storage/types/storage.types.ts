import { AssetArea } from 'src/entities/enums/assetarea';
import { AssetKind } from 'src/entities/enums/assetkind';

export interface StorageUploadRequest {
   fileName: string;
   contentType: string;
   assetKind: AssetKind;
   intent: AssetArea;
   assetId: string;
}

export interface StorageUploadResponse {
   uploadUrl: string;
   fileKey: string;
   fields?: Record<string, string>;
   headers?: Record<string, string>;
   expiresIn: number;
}

export interface StorageAccessRequest {
   fileKey: string;
   expiresIn?: number; // Optional custom expiration time
}

export interface StorageAccessResponse {
   accessUrl: string;
   expiresIn: number;
}

export interface StorageMetadata {
   key: string;
   fileName: string;
   size: number;
   contentType: string;
   lastModified: Date;
   userId?: string;
}

export interface StorageDeleteRequest {
   fileKey: string;
}

export interface StorageDeleteResponse {
   success: boolean;
   message?: string;
}

// Removed StorageAccessType enum since all files are private in storage

// TTL Constants - Fixed values for optimal performance and reliability
export const STORAGE_TTL_CONSTANTS = {
   UPLOAD_SIGNATURE_MINUTES: 60, // 1 hour - sufficient for file uploads
   ACCESS_SIGNATURE_MINUTES: 30, // 30 minutes - ensures 15+ minutes remaining when retrieved from cache
   CACHE_DURATION_MINUTES: 15, // 15 minutes - memory cache duration
} as const;

export interface StorageConfig {
   tenantCode: string; // Tenant identifier for cache isolation
   maxFileSize: number; // bytes
   allowedContentTypes: string[];
   allowedFileExtensions: string[];
   storageProvider: 'azure' | 'aws' | 'gcs';
}

// Cloud Storage Provider Credentials
export interface CloudStorageCredentials {
   provider: 'azure' | 'aws' | 'gcs';
   azure?: {
      accountName: string;
      accountKey: string;
      containerName: string;
      customDomain?: string; // Optional custom domain for Azure Blob Storage
   };
   aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucketName: string;
      cloudFrontDomain?: string; // Optional CloudFront distribution domain
      cloudFrontKeyPairId?: string; // CloudFront key pair ID for signed URLs
      cloudFrontPrivateKey?: string; // CloudFront private key for signed URLs
   };
   gcs?: {
      projectId: string;
      privateKey: string;
      clientEmail: string;
      bucketName: string;
      customDomain?: string; // Optional custom domain for Google Cloud Storage
   };
}

// Cloud Storage Response Types
export interface UploadSignature {
   url: string;
   fields?: Record<string, string>; // For AWS S3 form fields
   headers?: Record<string, string>; // For Azure Blob headers
   expiresInMinutes: number;
}

export interface AccessSignature {
   url: string;
   expiresInMinutes: number;
}

export interface FileMetadata {
   key: string;
   size: number;
   contentType: string;
   lastModified: Date;
   etag?: string;
}
