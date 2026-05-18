import { cloneDeep } from 'lodash';
import { ContentSection } from './contentsection.model';
import { ContentSectionKind } from '../enums/contentsectionkind';
import { EntityRegistry } from '../entity.registry';

/**
 * Utility functions for cleaning up and processing content sections
 */
export class ContentUtils {
   /**
    * Processes and cleans up content sections for display
    * @param sourceContents The source content sections to process
    * @param workspaceId The workspace ID for asset lookups
    * @param entities The entity registry for accessing managers
    * @returns Processed content sections ready for display
    */
   static async processContentSections(sourceContents: ContentSection[], workspaceId: string, entities: EntityRegistry): Promise<ContentSection[]> {
      if (!sourceContents) {
         return [];
      }

      // Clone the source contents to avoid mutating the original
      const displayContents = cloneDeep(sourceContents);

      // Process each section
      for (const section of displayContents) {
         await this.processContentSection(section, workspaceId, entities);
      }

      return displayContents;
   }

   /**
    * Processes a single content section
    * @param section The content section to process
    * @param workspaceId The workspace ID for asset lookups
    * @param entities The entity registry for accessing managers
    */
   private static async processContentSection(section: ContentSection, workspaceId: string, entities: EntityRegistry): Promise<void> {
      // Handle image sections
      if (section.section_kind === ContentSectionKind.image) {
         await this.processImageSection(section, workspaceId, entities);
      }

      // Future: Add processing for other section types here
      // Example:
      // if (section.section_kind === ContentSectionKind.video) {
      //    await this.processVideoSection(section, workspaceId, entities);
      // }
   }

   /**
    * Processes an image content section by loading asset information
    * @param section The image content section to process
    * @param workspaceId The workspace ID for asset lookups
    * @param entities The entity registry for accessing managers
    */
   private static async processImageSection(section: ContentSection, jurisdiction_id: string, entities: EntityRegistry): Promise<void> {
      if (section.asset_id) {
         try {
            const asset = await entities.jurisdictionAssetManager.getById(jurisdiction_id, section.asset_id);
            section.photo = asset?.toInfo();
         } catch (error) {
            // Log error but don't fail the entire process
            console.warn(`Failed to load asset ${section.asset_id} for jurisdiction ${jurisdiction_id}:`, error);
         }
      }
   }
}
