import { Body, Controller, ForbiddenException, Logger, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { ItemResult } from 'src/shared/types/data/item-result';
import { AuthGuard } from 'src/shared/access-control/auth.guard';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { RateLimitGuard } from 'src/shared/access-control/rate-limit.guard';
import { sanitizeFileName } from 'src/shared/utils';
import { EntityRegistry } from 'src/entities/entity.registry';
import { PreSignedUrl } from 'src/entities/presignedurl/presignedurl.model';
import 'src/entities/presignedurl/presignedurl.sanitized.validators';
import { CloudStorageHandler, ImageResizeService } from 'src/features/platform/storage';
import { UIException } from 'src/shared/exceptions/friendly-exception';
import { LocalizableString } from 'src/shared/types/i18n/localizable-string';
import { FilePathUtil } from 'src/features/platform/storage/utils/file-path.util';
import { isAllowedImageMime, isValidImageContent, MAGIC_BYTE_LENGTH } from 'src/features/platform/storage/utils/file-content-validator';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { StorageUtils } from 'src/features/utils/storage.utils';
import { StencilRequest } from 'src/shared/types/auth.types';
import { IUploadInfo, UploadInfo } from './models/uploadinfo';
import { Sanitize } from 'src/shared/utils/sanitized';
import { JurisdictionAsset } from 'src/entities/jurisdictionasset/jurisdictionasset.model';
import { AssetKind } from 'src/entities/enums/assetkind';

@Controller('v1/media')
@UseGuards(AuthGuard)
export class MediaController {
   private readonly logger = new Logger(MediaController.name);

   constructor(
      private readonly entities: EntityRegistry,
      private readonly cloudStorageHandler: CloudStorageHandler,
      private readonly imageResizeService: ImageResizeService
   ) {}

   @RateLimit({ points: 30, duration: 60 })
   @UseGuards(RateLimitGuard)
   @Post('prepare')
   async prepare(@Req() request: StencilRequest, @Body(Sanitize.for(UploadInfo)) input: IUploadInfo): Promise<ItemResult<PreSignedUrl>> {
      if (!request.account) {
         throw new ForbiddenException();
      }
      if (!input || !input.file_name || !input.mime_type) {
         throw new UIException(new LocalizableString('storage.invalidRequest', 'All data must be provided'));
      }

      if (input.asset_kind !== AssetKind.image && input.asset_kind !== AssetKind.avatar) {
         throw new UIException(new LocalizableString('media.invalidKind', 'Only image uploads are supported through this endpoint.'));
      }

      if (!isAllowedImageMime(input.mime_type)) {
         throw new UIException(new LocalizableString('storage.invalidType', 'File of that type is not allowed.'));
      }

      input.file_name = sanitizeFileName(input.file_name);

      const config = await this.cloudStorageHandler.getStorageConfigCached(request.account.jurisdiction_id);

      if (!config) {
         throw new UIException(new LocalizableString('storage.notConfigured', 'Storage not yet available for your workspace. Contact support.'));
      }

      // Validate content type
      const fileExtenstionWithPrefix = path.extname(input.file_name);
      if (!config.allowedFileExtensions.includes(fileExtenstionWithPrefix)) {
         throw new UIException(new LocalizableString('storage.invalidName', 'File of that kind is not allowed.'));
      }

      // Validate content type
      if (!config.allowedContentTypes.includes(input.mime_type)) {
         throw new UIException(new LocalizableString('storage.invalidType', 'File of that type is not allowed.'));
      }

      const asset_id = uuidv4();
      // Generate file path with jurisdiction, asset kind, intent, and asset identifier
      const filePath = FilePathUtil.generateFilePath(request.account.jurisdiction_id, input.asset_kind, input.asset_area, asset_id, input.file_name);

      const uploadSignature = await this.cloudStorageHandler.generateUploadSignature(request.account.jurisdiction_id, filePath, input.mime_type);

      //TODO:SHOULD: Track failed uploads for cleanup

      const insert = new JurisdictionAsset({
         jurisdiction_id: request.account.jurisdiction_id,
         _id: asset_id,
         account_id_creator: request.account._id,
         asset_kind: input.asset_kind,
         dependency: undefined,
         dependency_id: undefined,
         available: false,
         resize_required: true,
         resize_attempts: 0,
         storage_key: filePath,
         file_name: path.basename(filePath),
         thumb_large_key: undefined,
         size_kb: input.size_kb,
      });

      await this.entities.jurisdictionAssetManager.insert(request.account.jurisdiction_id, insert);

      const result: ItemResult<PreSignedUrl> = {
         success: true,
         item: {
            id: asset_id,
            url: filePath,
            signed_url: uploadSignature.url,
            mime_type: input.mime_type,
            asset_kind: input.asset_kind,
         },
      };
      return result;
   }

   @RateLimit({ points: 30, duration: 60 })
   @UseGuards(RateLimitGuard)
   @Post('complete')
   async createFromUpload(@Req() request: StencilRequest, @Body(Sanitize.for(PreSignedUrl)) input: PreSignedUrl): Promise<ItemResult<JurisdictionAsset.Info>> {
      if (!request.account) {
         throw new ForbiddenException();
      }

      const found = await this.entities.jurisdictionAssetManager.getById(request.account.jurisdiction_id, input.id);
      if (!found || found.available) {
         throw new NotFoundException();
      }
      if (found.account_id_creator !== request.account._id) {
         throw new NotFoundException();
      }

      const processInfo = found.asProcessPerspective();
      processInfo.dependency = input.dependency;
      processInfo.dependency_id = input.dependency_id;

      const config = await this.cloudStorageHandler.getStorageConfigCached(request.account.jurisdiction_id);
      const fileMetadata = await this.cloudStorageHandler.getFileMetadata(request.account.jurisdiction_id, found.storage_key);

      if (!fileMetadata || fileMetadata.size < 1) {
         throw new UIException(new LocalizableString('media.complete.emptyFile', 'Content not yet uploaded.'));
      }

      // Enforce max file size (PUT presigned URLs cannot enforce this server-side)
      if (config && fileMetadata.size > config.maxFileSize) {
         this.logger.warn(`Asset ${found._id} exceeds max file size: ${fileMetadata.size} > ${config.maxFileSize}`);
         await this.cloudStorageHandler.deleteFile(request.account.jurisdiction_id, found.storage_key);
         throw new UIException(new LocalizableString('media.complete.tooLarge', 'Uploaded file exceeds the maximum allowed size.'));
      }

      // Verify S3 stored content-type is an allowed image MIME
      if (!isAllowedImageMime(fileMetadata.contentType)) {
         this.logger.warn(`Asset ${found._id} has disallowed content-type from S3: ${fileMetadata.contentType}`);
         await this.cloudStorageHandler.deleteFile(request.account.jurisdiction_id, found.storage_key);
         throw new UIException(new LocalizableString('media.complete.invalidType', 'Uploaded file type is not allowed.'));
      }

      // Magic byte verification — download first bytes and confirm actual content matches an image format
      // Avatars are also validated here; Sharp re-encodes as an additional layer but this catches it early
      const header = await this.cloudStorageHandler.downloadFileHead(request.account.jurisdiction_id, found.storage_key, MAGIC_BYTE_LENGTH);
      if (!header || !isValidImageContent(header)) {
         this.logger.warn(`Asset ${found._id} failed magic byte validation (declared: ${fileMetadata.contentType})`);
         await this.cloudStorageHandler.deleteFile(request.account.jurisdiction_id, found.storage_key);
         throw new UIException(
            new LocalizableString('media.complete.invalidContent', 'Uploaded file content does not match a supported image format.')
         );
      }

      processInfo.size_kb = Math.round(fileMetadata.size / 1024);

      switch (found.asset_kind) {
         case AssetKind.avatar: {
            const avatarResizeResult = await this.imageResizeService.processStoredImage(request.account.jurisdiction_id, found.storage_key, {
               timeoutMs: 30000,
               small: { width: 128, height: 128, fit: 'cover', format: 'webp', quality: 80 },
               large: { width: 512, height: 512, fit: 'cover', format: 'webp', quality: 85 },
            });

            if (avatarResizeResult.success) {
               if (avatarResizeResult.thumbSmallKey) {
                  await this.cloudStorageHandler.makeFilePublic(request.account.jurisdiction_id, avatarResizeResult.thumbSmallKey);
               }
               if (avatarResizeResult.thumbLargeKey) {
                  await this.cloudStorageHandler.makeFilePublic(request.account.jurisdiction_id, avatarResizeResult.thumbLargeKey);
               }

               processInfo.available = true;
               processInfo.resize_required = false;
               processInfo.thumb_small_key = avatarResizeResult.thumbSmallKey;
               processInfo.thumb_large_key = avatarResizeResult.thumbLargeKey;
               processInfo.resize_attempts = 0;
            } else {
               this.logger.warn(`Avatar resize failed for asset ${found._id}: ${avatarResizeResult.error}`);
               processInfo.available = true;
               processInfo.resize_required = true;
               processInfo.thumb_large_key = found.storage_key;
               processInfo.thumb_small_key = found.storage_key;
               processInfo.resize_attempts = 1;
            }
            break;
         }
         case AssetKind.image:
            processInfo.available = true;
            processInfo.resize_required = false;
            processInfo.thumb_large_key = input.url;
            processInfo.resize_attempts = 0;
            break;
         default:
            break;
      }

      await this.entities.jurisdictionAssetManager.updateProcessPerspective(processInfo);

      const data = found.toInfo();

      await StorageUtils.hydrateAssetUrls(this.cloudStorageHandler, data);

      const result: ItemResult<JurisdictionAsset.Info> = {
         success: true,
         item: data,
      };
      return result;
   }
}
