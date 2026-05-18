import { JurisdictionAsset } from 'src/entities/jurisdictionasset/jurisdictionasset.model';
import { CloudStorageHandler } from '../platform/storage';
import { MediaInfo } from 'src/entities/mediainfo/mediainfo.model';
import { Account } from 'src/entities/account/account.model';
import { isNullOrWhiteSpace } from 'src/shared/utils';
import { AssetKind } from 'src/entities/enums/assetkind';

/**
 * Utility class for handling cloud storage operations and URL generation.
 * Provides methods to convert storage keys to accessible URLs using various signature strategies.
 */
export class StorageUtils {
   static async hydrateAvatarsUrls(cloudStorageHandler: CloudStorageHandler, accounts: (Account.Connection | Account.Public)[]): Promise<void> {
      if (accounts) {
         for (const account of accounts) {
            if (account) {
               await this.hydrateAvatarUrls(cloudStorageHandler, account);
            }
         }
      }
   }

   static async hydrateAvatarUrls(
      cloudStorageHandler: CloudStorageHandler,
      account?: Account.Connection | Account.Public | undefined
   ): Promise<void> {
      if (!account?.avatar) {
         return;
      }

      const avatar = account.avatar;

      // Need jurisdiction_id to resolve the storage provider
      if (!avatar.jurisdiction_id || isNullOrWhiteSpace(avatar.jurisdiction_id)) {
         return;
      }

      const tenantCode = avatar.jurisdiction_id;

      // Generate public URLs from keys (avatars are always public)
      // getPublicUrl is just string construction - no API call
      if (avatar.thumb_small_key) {
         avatar.thumb_small_url = await cloudStorageHandler.getPublicUrl(tenantCode, avatar.thumb_small_key);
         avatar.thumb_small_key = undefined; // Clear key to prevent exposure
      }

      if (avatar.thumb_large_key) {
         avatar.thumb_large_url = await cloudStorageHandler.getPublicUrl(tenantCode, avatar.thumb_large_key);
         avatar.thumb_large_key = undefined; // Clear key to prevent exposure
      }
   }

   /**
    * Hydrates media asset objects with signed URLs for thumbnail access.
    *
    * This method mutates the provided mediaInfo object by:
    * 1. Converting storage keys (thumb_small_key, thumb_medium_key, thumb_large_key) to accessible URLs
    * 2. Setting the corresponding URL fields (thumb_small_url, thumb_medium_url, thumb_large_url)
    * 3. Clearing the key fields to prevent accidental exposure of internal storage paths
    *
    * @param cloudStorageHandler - The cloud storage handler instance for generating signatures
    * @param mediaInfo - The media info object to hydrate (can be MediaInfo or JurisdictionAsset.Info)
    * @param shared_signature - If true, uses a single cached bucket-level signature for all files (more efficient for lists).
    *                          If false, generates individual file-specific signatures (more secure, less efficient).
    * @param small - Whether to process the small thumbnail (thumb_small_key -> thumb_small_url)
    * @param large - Whether to process the large thumbnail (thumb_large_key -> thumb_large_url)
    *
    * @example
    * ```typescript
    * // For a list of items (efficient - uses shared signature)
    * await StorageUtils.hydrateAssetUrls(cloudStorageHandler, mediaInfo, true);
    *
    * // For individual items (secure - uses individual signatures)
    * await StorageUtils.hydrateAssetUrls(cloudStorageHandler, mediaInfo, false);
    *
    * // Only process small thumbnails
    * await StorageUtils.hydrateAssetUrls(cloudStorageHandler, mediaInfo, true, true, false, false);
    * ```
    */
   static async hydrateAssetUrls(
      cloudStorageHandler: CloudStorageHandler,
      mediaInfo?: MediaInfo | JurisdictionAsset.Info,
      shared_signature: boolean = true,
      small: boolean = true,
      large: boolean = true,
      raw: boolean = false
   ): Promise<void> {
      // Early return if no media info provided
      if (!mediaInfo) {
         return;
      }

      if (!mediaInfo.jurisdiction_id || isNullOrWhiteSpace(mediaInfo.jurisdiction_id)) {
         console.warn('mediaInfo not fully hydrated with jurisdiction_id: ' + mediaInfo._id); //TODO:MUST:Find any causes
         return;
      }

      const tenantCode = mediaInfo.jurisdiction_id;

      // Avatars are public - use unsigned URLs
      const isPublic = mediaInfo.asset_kind === AssetKind.avatar;

      // Process raw
      if (mediaInfo.storage_key) {
         if (raw) {
            if (isPublic) {
               // Public assets use unsigned URLs
               mediaInfo.raw_url = await cloudStorageHandler.getPublicUrl(tenantCode, mediaInfo.storage_key);
            } else if (shared_signature) {
               // Use bucket-level signature (cached, efficient for multiple files)
               mediaInfo.raw_url = await cloudStorageHandler.generateFileAccessSignatureBucket(tenantCode, mediaInfo.storage_key);
            } else {
               // Use individual file signature (more secure, less efficient)
               const signature = await cloudStorageHandler.generateFileAccessSignatureSingle(tenantCode, mediaInfo.storage_key);
               mediaInfo.raw_url = signature.url;
            }
         }
         // Clear the key to prevent accidental exposure of internal storage paths
         mediaInfo.storage_key = undefined;
      }

      // Process small thumbnail
      if (mediaInfo.thumb_small_key) {
         if (small) {
            if (isPublic) {
               // Public assets use unsigned URLs
               mediaInfo.thumb_small_url = await cloudStorageHandler.getPublicUrl(tenantCode, mediaInfo.thumb_small_key);
            } else if (shared_signature) {
               // Use bucket-level signature (cached, efficient for multiple files)
               mediaInfo.thumb_small_url = await cloudStorageHandler.generateFileAccessSignatureBucket(tenantCode, mediaInfo.thumb_small_key);
            } else {
               // Use individual file signature (more secure, less efficient)
               const signature = await cloudStorageHandler.generateFileAccessSignatureSingle(tenantCode, mediaInfo.thumb_small_key);
               mediaInfo.thumb_small_url = signature.url;
            }
         }
         // Clear the key to prevent accidental exposure of internal storage paths
         mediaInfo.thumb_small_key = undefined;
      }

      // Process large thumbnail
      if (mediaInfo.thumb_large_key) {
         if (large) {
            if (isPublic) {
               // Public assets use unsigned URLs
               mediaInfo.thumb_large_url = await cloudStorageHandler.getPublicUrl(tenantCode, mediaInfo.thumb_large_key);
            } else if (shared_signature) {
               // Use bucket-level signature (cached, efficient for multiple files)
               mediaInfo.thumb_large_url = await cloudStorageHandler.generateFileAccessSignatureBucket(tenantCode, mediaInfo.thumb_large_key);
            } else {
               // Use individual file signature (more secure, less efficient)
               const signature = await cloudStorageHandler.generateFileAccessSignatureSingle(tenantCode, mediaInfo.thumb_large_key);
               mediaInfo.thumb_large_url = signature.url;
            }
         }
         // Clear the key to prevent accidental exposure of internal storage paths
         mediaInfo.thumb_large_key = undefined;
      }
   }
}
