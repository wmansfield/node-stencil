import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EntityRegistry } from 'src/entities/entity.registry';
import { JurisdictionSchemaVersion } from 'src/entities/enums/jurisdictionschemaversion';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { MAX_INT_32 } from 'src/shared/constants/int';
import { upgradeTo_v2026_05_26 } from './jurisdictions/schema-2026-05-26';
import { upgradeTo_v2026_05_27 } from './jurisdictions/schema-2026-05-27';

type JurisdictionUpgrade = {
   version_to_upgrade: JurisdictionSchemaVersion;
   upgrade_method: (logger: Logger, entities: EntityRegistry, connectionProvider: MongoConnectionProvider, jurisdiction_id: string) => Promise<void>;
   version_after: JurisdictionSchemaVersion;
};

@Injectable()
export class JurisdictionSchemaService {
   private readonly logger = new Logger(JurisdictionSchemaService.name);

   constructor(
      private readonly entities: EntityRegistry,
      private readonly connectionProvider: MongoConnectionProvider
   ) {}

   @Interval(15 * 60 * 1000)
   async checkSchemaVersions() {
      await this.performProcess();
   }

   async triggerProcess(): Promise<{ success: boolean; error?: string }> {
      this.logger.log('Manual Upgrade triggered');
      return await this.performProcess();
   }

   private async performProcess(): Promise<{ success: boolean; error?: string }> {
      try {
         this.logger.log('Upgrade Process Starting.');

         await this.upgradeJurisdictions();

         this.logger.log('Upgrade Process Complete.');
         return { success: true };
      } catch (error) {
         this.logger.error(`Error during Schema Upgrade: ${error?.message}`, error?.stack);
         return { success: false, error: error?.message };
      }
   }

   private async upgradeJurisdictions(): Promise<void> {
      try {
         this.logger.log('Jurisdiction Upgrades Starting.');

         // The first two of these are demonstrative, they can be removed once you have real ones.
         const upgrades: JurisdictionUpgrade[] = [
            {
               version_to_upgrade: JurisdictionSchemaVersion.unknown,
               upgrade_method: upgradeTo_v2026_05_26,
               version_after: JurisdictionSchemaVersion.v2026_05_26,
            },
            {
               version_to_upgrade: JurisdictionSchemaVersion.v2026_05_26,
               upgrade_method: upgradeTo_v2026_05_27,
               version_after: JurisdictionSchemaVersion.v2026_05_27,
            },
         ];

         const SETTING_KEY = 'schema_version';

         const jurisdictions = await this.entities.jurisdictionManager.find(0, MAX_INT_32);
         for (const jurisdiction of jurisdictions.items) {
            try {
               let currentVersion: number =
                  (await this.entities.jurisdictionSettingManager.getValueOrDefaultInt(
                     jurisdiction._id,
                     SETTING_KEY,
                     JurisdictionSchemaVersion.unknown
                  )) ?? JurisdictionSchemaVersion.unknown;

               if (currentVersion < JurisdictionSchemaVersion.current) {
                  this.logger.debug(`Upgrading jurisdiction: ${jurisdiction._id} from version ${currentVersion}`);

                  for (const upgrade of upgrades) {
                     if (currentVersion === upgrade.version_to_upgrade) {
                        await upgrade.upgrade_method(this.logger, this.entities, this.connectionProvider, jurisdiction._id);
                        currentVersion = upgrade.version_after;
                        await this.entities.jurisdictionSettingManager.upsertInt(jurisdiction._id, SETTING_KEY, currentVersion);
                     }
                  }
               }
            } catch (error) {
               this.logger.error(`Error upgrading jurisdiction ${jurisdiction._id}: ${error?.message}`, error?.stack);
            }
         }

         this.logger.log('Jurisdiction Upgrades complete.');
      } catch (error) {
         this.logger.error(`Error during Jurisdiction Upgrades: ${error?.message}`, error?.stack);
      }
   }
}
