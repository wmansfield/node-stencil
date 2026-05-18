import { UploadSignature, AccessSignature, FileMetadata } from './storage.types';

export interface ICloudStorageProvider {
   /**
    * Generate a presigned URL for file upload (PUT-based)
    * @param key - The file key/path in storage
    * @param contentType - MIME type of the file
    * @param expiresInMinutes - Expiration time in minutes (default: 60 minutes)
    * @returns Upload signature with URL and required fields/headers
    */
   generateUploadSignature(key: string, contentType: string, expiresInMinutes?: number): Promise<UploadSignature>;

   /**
    * Generate a presigned POST policy for file upload with size enforcement.
    * The client must POST a multipart/form-data request including the returned fields.
    * @param key - The file key/path in storage
    * @param contentType - MIME type of the file
    * @param maxSizeBytes - Maximum allowed file size in bytes (enforced by storage provider)
    * @param expiresInMinutes - Expiration time in minutes (default: 60 minutes)
    * @returns Upload signature with URL and required form fields
    */
   generatePostUploadSignature(key: string, contentType: string, maxSizeBytes: number, expiresInMinutes?: number): Promise<UploadSignature>;

   /**
    * Generate a presigned URL for file access
    * @param key - The file key/path in storage
    * @param expiresInMinutes - Expiration time in minutes
    * @returns Access signature with URL and expiration
    */
   generateAccessSignature(key: string, expiresInMinutes: number): Promise<AccessSignature>;

   /**
    * Generate a bucket-level access signature for public access
    * @returns Access signature with base URL for public bucket
    */
   generatePublicBucketAccessSignature(): Promise<AccessSignature>;

   /**
    * Generate a bucket-level access signature for private access
    * @param expiresInMinutes - Expiration time in minutes
    * @returns Access signature with signed URL for private bucket
    */
   generatePrivateBucketAccessSignature(expiresInMinutes: number): Promise<AccessSignature>;

   /**
    * Get file metadata
    * @param key - The file key/path in storage
    * @returns File metadata or null if not found
    */
   getFileMetadata(key: string): Promise<FileMetadata | null>;

   /**
    * Delete a file from storage
    * @param key - The file key/path in storage
    * @returns True if successful, false otherwise
    */
   deleteFile(key: string): Promise<boolean>;

   /**
    * Check if a file exists in storage
    * @param key - The file key/path in storage
    * @returns True if exists, false otherwise
    */
   fileExists(key: string): Promise<boolean>;

   /**
    * Combine a bucket access signature with a specific file key to create a file access URL
    * @param bucketAccessSignature - The bucket-level access signature
    * @param fileKey - The file key/path in storage
    * @returns Complete file access URL
    */
   combineBucketAccessWithFileKey(bucketAccessSignature: AccessSignature, fileKey: string): string;

   /**
    * Make a file publicly accessible by its key
    * @param key - The file key/path in storage
    * @returns True if successful, false otherwise
    */
   makeFilePublic(key: string): Promise<boolean>;

   /**
    * Get the public URL for a file (no signature required)
    * Only works for files that have been made public via makeFilePublic()
    * @param key - The file key/path in storage
    * @returns The public URL for the file
    */
   getPublicUrl(key: string): string;

   /**
    * Download the first N bytes of a file from storage using a range request.
    * Efficient for magic-byte validation without downloading the full object.
    * @param key - The file key/path in storage
    * @param bytes - Number of bytes to read from the start of the file
    * @returns Buffer of the first N bytes, or null if not found
    */
   downloadFileHead(key: string, bytes: number): Promise<Buffer | null>;

   /**
    * Download a file from storage as a Buffer
    * @param key - The file key/path in storage
    * @returns File contents as Buffer, or null if not found
    */
   downloadFile(key: string): Promise<Buffer | null>;

   /**
    * Upload a file to storage from a Buffer
    * @param key - The file key/path in storage
    * @param data - The file contents as Buffer
    * @param contentType - MIME type of the file
    * @returns True if successful
    */
   uploadFile(key: string, data: Buffer, contentType: string): Promise<boolean>;
}
