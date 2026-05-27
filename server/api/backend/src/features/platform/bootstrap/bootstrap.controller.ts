import { Controller, Get, Logger, ForbiddenException } from '@nestjs/common';
import { RateLimit } from 'src/shared/access-control/rate-limit.decorator';
import { GlobalSetting } from 'src/entities/globalsetting/globalsetting.model';
import { EntityRegistry } from 'src/entities/entity.registry';
import { MAX_INT_32 } from 'src/shared/constants/int';
import { Timezone } from 'src/entities/timezone/timezone.model';
import { TIME_ZONE_USA } from 'src/shared/constants/general';
import { Role } from 'src/entities/role/role.model';
import { AdminPermissions } from 'src/shared/constants/permissions/admin';
import { Jurisdiction } from 'src/entities/jurisdiction/jurisdiction.model';
import { RoleSyncService } from 'src/tasks/role-sync.service';

/** Bootstrap is only available outside production. Idempotent — safe to call repeatedly. */
const BOOTSTRAP_ENABLED = process.env.NODE_ENV !== 'production';

@Controller('platform/bootstrap')
export class BootstrapController {
   private readonly logger = new Logger(BootstrapController.name);

   constructor(
      private readonly entities: EntityRegistry,
      private readonly roleSyncService: RoleSyncService,
   ) {}

   @RateLimit({ points: 5, duration: 60 })
   @Get()
   async bootstrap() {
      if (!BOOTSTRAP_ENABLED) {
         throw new ForbiddenException();
      }
      this.logger.log('Starting system bootstrap...');

      const boostrapped = await this.entities.globalSettingManager.getValueOrDefaultString('bootstrapped', undefined);
      if (boostrapped) {
         this.logger.log('System already bootstrapped');
         const roleSync = await this.roleSyncService.triggerSync();
         return { status: 'already_bootstrapped', roleSync };
      }

      await this.ensureRoles();

      const roleSync = await this.roleSyncService.triggerSync();

      await this.ensureTimeZones();

      await this.ensureJurisdictions();

      this.logger.log('Creating Global Setting');
      await this.entities.globalSettingManager.insert(
         new GlobalSetting({
            _id: 'bootstrapped',
            value: new Date().toString(),
         })
      );
      this.logger.log('Done Bootstrapping...');
      return { status: 'bootstrapped', roleSync };
   }

   private async ensureRoles() {
      const roles = await this.entities.roleManager.find(0, 1);
      if (roles.items.length == 0) {
         const role = new Role({
            _id: 'admin',
            permissions: [AdminPermissions.Admin.Role.Read, AdminPermissions.Admin.Role.Write],
         });
         await this.entities.roleManager.insert(role);
      }
   }

   private async ensureJurisdictions() {
      this.logger.log('jurisdictions ensuring');

      const jurisdictions = await this.entities.jurisdictionManager.find(0, 1);
      if (jurisdictions.items.length == 0) {
         const items = ['US', 'UK', 'EU', 'CA'];
         for (const item of items) {
            const insert = new Jurisdiction({
               _id: item,
            });
            await this.entities.jurisdictionManager.insert(insert);
         }
      }

      this.logger.log('jurisdictions ensured');
   }

   private async ensureTimeZones() {
      const usaZones = [
         'America/New_York',
         'America/Chicago',
         'America/Denver',
         'America/Los_Angeles',
         'America/Anchorage',
         'America/Juneau',
         'America/Nome',
         'America/Sitka',
         'America/Adak',
         'Pacific/Honolulu',
         'America/Puerto_Rico',
         'America/Guam',
         'Pacific/Saipan',
         'America/Virgin',
         'America/Phoenix',
         'America/Boise',
         'America/Indiana/Indianapolis',
         'America/Indiana/Knox',
         'America/Indiana/Marengo',
         'America/Indiana/Petersburg',
         'America/Indiana/Tell_City',
         'America/Indiana/Vevay',
         'America/Indiana/Vincennes',
         'America/Indiana/Winamac',
      ];
      const toTimeZone = (zone: string): Timezone => {
         let displayName = zone;

         if (zone.includes('/')) {
            const parts = zone.split('/');
            const city = parts[parts.length - 1].replace(/_/g, ' ');
            const region = parts[0];

            if (region === 'America') {
               if (zone.includes('New_York') || zone.includes('Indiana')) {
                  displayName = `Eastern Time - ${city} (US)`;
               } else if (zone.includes('Chicago')) {
                  displayName = `Central Time - ${city} (US)`;
               } else if (zone.includes('Denver') || zone.includes('Boise')) {
                  displayName = `Mountain Time - ${city} (US)`;
               } else if (zone.includes('Los_Angeles')) {
                  displayName = `Pacific Time - ${city} (US)`;
               } else if (zone.includes('Phoenix')) {
                  displayName = `Mountain Time - ${city} (US)`;
               } else if (zone.includes('Anchorage') || zone.includes('Juneau')) {
                  displayName = `Alaska Time - ${city} (US)`;
               } else if (zone.includes('Honolulu')) {
                  displayName = `Hawaii Time - ${city} (US)`;
               } else {
                  displayName = `${city} (${region})`;
               }
            } else if (region === 'Europe') {
               if (zone.includes('London')) {
                  displayName = `London Time - ${city} (Europe)`;
               } else if (zone.includes('Paris') || zone.includes('Berlin')) {
                  displayName = `Central European Time - ${city} (Europe)`;
               } else {
                  displayName = `${city} (${region})`;
               }
            } else if (region === 'Asia') {
               if (zone.includes('Tokyo')) {
                  displayName = `Japan Time - ${city} (Asia)`;
               } else if (zone.includes('Shanghai') || zone.includes('Beijing')) {
                  displayName = `China Time - ${city} (Asia)`;
               } else {
                  displayName = `${city} (${region})`;
               }
            } else {
               displayName = `${city} (${region})`;
            }
         }

         try {
            let standardAbbr = '';
            if (zone.includes('New_York') || zone.includes('Indiana')) {
               standardAbbr = 'EST';
            } else if (zone.includes('Chicago')) {
               standardAbbr = 'CST';
            } else if (zone.includes('Denver') || zone.includes('Boise')) {
               standardAbbr = 'MST';
            } else if (zone.includes('Los_Angeles')) {
               standardAbbr = 'PST';
            } else if (zone.includes('Phoenix')) {
               standardAbbr = 'MST';
            } else if (zone.includes('Anchorage') || zone.includes('Juneau')) {
               standardAbbr = 'AKST';
            } else if (zone.includes('Honolulu')) {
               standardAbbr = 'HST';
            } else if (zone.includes('London')) {
               standardAbbr = 'GMT';
            } else if (zone.includes('Paris') || zone.includes('Berlin')) {
               standardAbbr = 'CET';
            } else if (zone.includes('Tokyo')) {
               standardAbbr = 'JST';
            } else if (zone.includes('Shanghai') || zone.includes('Beijing')) {
               standardAbbr = 'CST';
            } else {
               const now = new Date();
               const formatter = new Intl.DateTimeFormat('en-US', {
                  timeZone: zone,
                  timeZoneName: 'short',
               });
               const timeZonePart = formatter.formatToParts(now).find(p => p.type === 'timeZoneName');
               standardAbbr = timeZonePart?.value || 'UTC';
            }

            displayName += ` (${standardAbbr})`;
         } catch (error) {
            displayName += ' (UTC)';
         }

         const sort = (usaZones.includes(zone) ? 'us' : 'zz') + `_${displayName}`;
         const tag = usaZones.includes(zone) ? TIME_ZONE_USA : undefined;

         return new Timezone({
            _id: zone,
            iana_zone: zone,
            display_name: displayName,
            ui_sort: sort,
            tag: tag,
         });
      };

      this.logger.log('Ensuring timezones...');

      const knownTimezoneData = await this.entities.timezoneManager.find(0, MAX_INT_32);
      const knownTimezones = new Map<string, Timezone>();
      knownTimezoneData.items.forEach(item => {
         knownTimezones.set(item.iana_zone, item);
      });

      const systemZones = Intl.supportedValuesOf('timeZone');
      for (const zone of systemZones) {
         const found = knownTimezones.get(zone);
         if (!found) {
            const added = await this.entities.timezoneManager.insert(toTimeZone(zone));
            knownTimezones.set(zone, added);
         }
      }
   }
}
