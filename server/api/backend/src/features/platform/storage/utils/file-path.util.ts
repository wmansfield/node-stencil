import { AssetArea } from 'src/entities/enums/assetarea';
import { AssetKind } from 'src/entities/enums/assetkind';

export class FilePathUtil {
   /**
    * Generates a file path for storage based on tenant, asset kind, intent, and asset identifier
    * Files are organized by /assetkind/intent/unique_identifier/file.name
    * @param tenant - Tenant identifier
    * @param asset_kind - Asset kind from enum (image, video, pdf)
    * @param intent - Asset intent/purpose (e.g., 'profile', 'announcement')
    * @param target_id - Unique asset identifier
    * @param file_name - Original filename with extension
    * @returns Generated file path
    */
   static generateFilePath(tenant: string, asset_kind: AssetKind, area: AssetArea, target_id: string, file_name: string): string {
      // Sanitize inputs to ensure valid path components
      const sanitizedTenant = this.sanitizePathComponent(tenant);
      const sanitizedAssetKind = this.sanitizePathComponent(AssetKind[asset_kind]);
      const sanitizedIntent = this.sanitizePathComponent(AssetArea[area].toString());
      const sanitizedAssetId = this.sanitizePathComponent(target_id);
      const sanitizedFileName = this.sanitizeFileName(file_name);

      return `v1/${sanitizedTenant}/${sanitizedAssetKind}/${sanitizedIntent}/${sanitizedAssetId}/${sanitizedFileName}`;
   }

   /**
    * Extracts file extension from a filename
    * @param fileName - The filename to extract extension from
    * @returns File extension including the dot (e.g., '.jpg') or empty string if no extension
    */
   static getFileExtension(fileName: string): string {
      const lastDot = fileName.lastIndexOf('.');
      return lastDot !== -1 ? fileName.substring(lastDot) : '';
   }

   /**
    * Sanitizes a path component to ensure it's safe for file system usage
    * @param component - Path component to sanitize
    * @returns Sanitized path component
    */
   private static sanitizePathComponent(component: string): string {
      return component
         .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
         .replace(/_{2,}/g, '_') // Replace multiple underscores with single
         .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
   }

   /**
    * Sanitizes a filename to ensure it's safe for file system usage
    * @param fileName - Filename to sanitize
    * @returns Sanitized filename
    */
   private static sanitizeFileName(fileName: string): string {
      return fileName
         .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
         .replace(/_{2,}/g, '_') // Replace multiple underscores with single
         .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
   }

   /**
    * Generates a storage path for encrypted assets.
    * Organized by month and account prefix for scale:
    *   v1/{jurisdiction}/encrypted/{YYYY-MM}/{account_prefix}/{asset_id}.enc
    */
   static generateEncryptedAssetPath(jurisdiction: string, accountId: string, assetId: string): string {
      const sanitizedJurisdiction = this.sanitizePathComponent(jurisdiction);
      const sanitizedAssetId = this.sanitizePathComponent(assetId);
      const accountPrefix = this.sanitizePathComponent(accountId.substring(0, 8));
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      return `v1/${sanitizedJurisdiction}/encrypted/${yearMonth}/${accountPrefix}/${sanitizedAssetId}.enc`;
   }

   /**
    * Parses a file path to extract its components
    * @param filePath - File path to parse
    * @returns Object containing version, tenant, assetKind, intent, assetId, and fileName
    */
   static parseFilePath(
      filePath: string
   ): { version: string; tenant: string; assetKind: string; intent: string; assetId: string; fileName: string } | null {
      const parts = filePath.split('/');
      if (parts.length !== 6) {
         return null;
      }

      return {
         version: parts[0],
         tenant: parts[1],
         assetKind: parts[2],
         intent: parts[3],
         assetId: parts[4],
         fileName: parts[5],
      };
   }
}
