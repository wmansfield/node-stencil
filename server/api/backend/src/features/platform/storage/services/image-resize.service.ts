import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as path from 'path';
import { CloudStorageHandler } from '../handlers/cloud-storage.handler';

/**
 * Configuration for a single resize operation
 */
export interface ResizeConfig {
   /** Target width in pixels */
   width: number;
   /** Target height in pixels */
   height: number;
   /** Fit mode for resizing */
   fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
   /** Output format (defaults to webp for efficiency) */
   format?: 'webp' | 'jpeg' | 'png';
   /** Quality for lossy formats (1-100, default 80) */
   quality?: number;
}

/**
 * Result of a single resize operation
 */
export interface ResizeResult {
   /** The resized image buffer */
   buffer: Buffer;
   /** Width of the resized image */
   width: number;
   /** Height of the resized image */
   height: number;
   /** MIME type of the output */
   mimeType: string;
   /** File extension (with dot) */
   extension: string;
}

/**
 * Options for the resize job
 */
export interface ImageResizeOptions {
   /** Timeout in milliseconds (default: 30000) */
   timeoutMs?: number;
   /** Small thumbnail configuration */
   small?: ResizeConfig;
   /** Large thumbnail configuration */
   large?: ResizeConfig;
}

/**
 * Result of a complete resize job
 */
export interface ImageResizeJobResult {
   success: boolean;
   /** Small thumbnail result */
   small?: ResizeResult;
   /** Large thumbnail result */
   large?: ResizeResult;
   /** Error message if failed */
   error?: string;
}

/**
 * Result of processing and uploading resized images
 */
export interface ImageProcessResult {
   success: boolean;
   /** Storage key for small thumbnail */
   thumbSmallKey?: string;
   /** Storage key for large thumbnail */
   thumbLargeKey?: string;
   /** Error message if failed */
   error?: string;
}

/** Default resize configurations */
export const DEFAULT_RESIZE_CONFIG = {
   small: {
      width: 128,
      height: 128,
      fit: 'cover' as const,
      format: 'webp' as const,
      quality: 80,
   },
   large: {
      width: 512,
      height: 512,
      fit: 'cover' as const,
      format: 'webp' as const,
      quality: 85,
   },
   timeoutMs: 30000,
};

/**
 * Service for resizing images with timeout support.
 *
 * This service is designed to be isolated so that future changes (e.g., queue-based
 * processing, worker threads, or external services) can be made without affecting
 * calling code.
 *
 * Current implementation: Inline Sharp processing (fast, suitable for most workloads)
 * Future options: Worker threads, Bull queue, Azure Functions, etc.
 */
@Injectable()
export class ImageResizeService {
   private readonly logger = new Logger(ImageResizeService.name);

   constructor(private readonly cloudStorageHandler: CloudStorageHandler) {}

   /**
    * Resize an image buffer to specified dimensions with timeout
    * @param input - Source image buffer
    * @param config - Resize configuration
    * @param timeoutMs - Timeout in milliseconds
    * @returns Promise resolving to resize result
    */
   async resizeSingle(input: Buffer, config: ResizeConfig, timeoutMs: number = DEFAULT_RESIZE_CONFIG.timeoutMs): Promise<ResizeResult> {
      return this.withTimeout(this.performResize(input, config), timeoutMs, 'Image resize operation timed out');
   }

   /**
    * Resize an image to multiple sizes (small and large thumbnails)
    * @param input - Source image buffer
    * @param options - Resize options including configurations and timeout
    * @returns Promise resolving to job result with all thumbnails
    */
   async resizeForThumbnails(input: Buffer, options?: ImageResizeOptions): Promise<ImageResizeJobResult> {
      const opts = this.mergeOptions(options);

      try {
         const results = await this.withTimeout(
            Promise.all([
               opts.small ? this.performResize(input, opts.small) : Promise.resolve(undefined),
               opts.large ? this.performResize(input, opts.large) : Promise.resolve(undefined),
            ]),
            opts.timeoutMs!,
            'Image resize operation timed out'
         );

         return {
            success: true,
            small: results[0],
            large: results[1],
         };
      } catch (error) {
         this.logger.error('Failed to resize image for thumbnails', error);
         return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during resize',
         };
      }
   }

   /**
    * Download an image from storage, resize it, and upload the thumbnails
    * @param tenantCode - Tenant/jurisdiction code
    * @param sourceKey - Storage key of the source image
    * @param options - Resize options
    * @returns Promise resolving to process result with thumbnail keys
    */
   async processStoredImage(tenantCode: string, sourceKey: string, options?: ImageResizeOptions): Promise<ImageProcessResult> {
      const opts = this.mergeOptions(options);

      try {
         // Download the source image
         const sourceBuffer = await this.withTimeout(
            this.cloudStorageHandler.downloadFile(tenantCode, sourceKey),
            opts.timeoutMs! / 2, // Use half the timeout for download
            'Image download timed out'
         );

         if (!sourceBuffer) {
            return {
               success: false,
               error: 'Source image not found',
            };
         }

         // Resize the image
         const resizeResult = await this.resizeForThumbnails(sourceBuffer, {
            ...opts,
            timeoutMs: opts.timeoutMs! / 2, // Use remaining timeout for resize
         });

         if (!resizeResult.success) {
            return {
               success: false,
               error: resizeResult.error,
            };
         }

         // Generate thumbnail keys based on source key
         const thumbKeys = this.generateThumbnailKeys(sourceKey, resizeResult);

         // Upload thumbnails in parallel
         const uploadPromises: Promise<boolean>[] = [];

         if (resizeResult.small && thumbKeys.small) {
            uploadPromises.push(this.cloudStorageHandler.uploadFile(tenantCode, thumbKeys.small, resizeResult.small.buffer, resizeResult.small.mimeType));
         }

         if (resizeResult.large && thumbKeys.large) {
            uploadPromises.push(this.cloudStorageHandler.uploadFile(tenantCode, thumbKeys.large, resizeResult.large.buffer, resizeResult.large.mimeType));
         }

         await Promise.all(uploadPromises);

         return {
            success: true,
            thumbSmallKey: thumbKeys.small,
            thumbLargeKey: thumbKeys.large,
         };
      } catch (error) {
         this.logger.error(`Failed to process stored image: ${sourceKey}`, error);
         return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during image processing',
         };
      }
   }

   /**
    * Perform the actual resize operation using Sharp
    *
    * Handles:
    * - EXIF orientation: Auto-rotates images based on EXIF metadata (common with phone photos)
    * - Format detection: Sharp auto-detects input format from buffer (JPEG, PNG, WebP, GIF, TIFF, HEIC*)
    * - Format conversion: Outputs to specified format (webp recommended for size/quality)
    *
    * *HEIC support requires libvips compiled with HEIC support
    */
   private async performResize(input: Buffer, config: ResizeConfig): Promise<ResizeResult> {
      const format = config.format || 'webp';
      const quality = config.quality || 80;
      const fit = config.fit || 'cover';

      let pipeline = sharp(input)
         // Auto-rotate based on EXIF orientation (fixes phone photos that appear sideways)
         .rotate()
         .resize(config.width, config.height, {
            fit,
            withoutEnlargement: true, // Don't upscale small images
         });

      // Apply format-specific processing
      switch (format) {
      case 'webp':
         pipeline = pipeline.webp({ quality });
         break;
      case 'jpeg':
         pipeline = pipeline.jpeg({ quality, mozjpeg: true });
         break;
      case 'png':
         pipeline = pipeline.png({ compressionLevel: 9 });
         break;
      }

      const outputBuffer = await pipeline.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      return {
         buffer: outputBuffer,
         width: metadata.width || config.width,
         height: metadata.height || config.height,
         mimeType: this.getMimeType(format),
         extension: this.getExtension(format),
      };
   }

   /**
    * Generate thumbnail storage keys based on source key
    * Uses path.posix to ensure forward slashes regardless of OS (storage keys are URLs, not local paths)
    */
   private generateThumbnailKeys(
      sourceKey: string,
      result: ImageResizeJobResult
   ): { small?: string; large?: string } {
      const parsed = path.posix.parse(sourceKey);
      const basePath = path.posix.join(parsed.dir, parsed.name);

      return {
         small: result.small ? `${basePath}_thumb_sm${result.small.extension}` : undefined,
         large: result.large ? `${basePath}_thumb_lg${result.large.extension}` : undefined,
      };
   }

   /**
    * Merge user options with defaults
    */
   private mergeOptions(options?: ImageResizeOptions): Required<ImageResizeOptions> {
      return {
         timeoutMs: options?.timeoutMs ?? DEFAULT_RESIZE_CONFIG.timeoutMs,
         small: options?.small ?? DEFAULT_RESIZE_CONFIG.small,
         large: options?.large ?? DEFAULT_RESIZE_CONFIG.large,
      };
   }

   /**
    * Get MIME type for format
    */
   private getMimeType(format: 'webp' | 'jpeg' | 'png'): string {
      switch (format) {
      case 'webp':
         return 'image/webp';
      case 'jpeg':
         return 'image/jpeg';
      case 'png':
         return 'image/png';
      }
   }

   /**
    * Get file extension for format
    */
   private getExtension(format: 'webp' | 'jpeg' | 'png'): string {
      switch (format) {
      case 'webp':
         return '.webp';
      case 'jpeg':
         return '.jpg';
      case 'png':
         return '.png';
      }
   }

   /**
    * Wrap a promise with a timeout
    */
   private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
      let timeoutHandle: NodeJS.Timeout;

      const timeoutPromise = new Promise<never>((_, reject) => {
         timeoutHandle = setTimeout(() => {
            reject(new Error(errorMessage));
         }, timeoutMs);
      });

      try {
         const result = await Promise.race([promise, timeoutPromise]);
         clearTimeout(timeoutHandle!);
         return result;
      } catch (error) {
         clearTimeout(timeoutHandle!);
         throw error;
      }
   }
}
