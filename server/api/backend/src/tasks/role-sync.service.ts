import { Injectable, Logger } from '@nestjs/common';
import { EntityRegistry } from 'src/entities/entity.registry';
import { AppPermissions } from 'src/shared/constants/permissions';

/** Permissions that should never be auto-assigned to any role */
const EXCLUDED_PERMISSIONS: string[] = [
   AppPermissions.Admin.Role.Write,
];

export type SyncData = {
   totalPermissions: number;
   addedPermissions: number;
   errors: string[];
};

@Injectable()
export class RoleSyncService {
   private readonly logger = new Logger(RoleSyncService.name);

   constructor(private readonly entities: EntityRegistry) {}

   async triggerSync(): Promise<SyncData> {
      try {
         this.logger.log('Starting admin role sync...');

         const result = await this.hydrateAdminRole();

         this.logger.log(`Admin role sync completed. Added ${result.addedPermissions} of ${result.totalPermissions} permissions.`);

         return result;
      } catch (error) {
         this.logger.error('Error during admin role sync:', error);
         return {
            totalPermissions: 0,
            addedPermissions: 0,
            errors: [error.message],
         };
      }
   }

   /**
    * Extracts all permission values from the AppPermissions object recursively
    */
   private extractAllPermissions(obj: any): string[] {
      const permissions: string[] = [];

      for (const key in obj) {
         const value = obj[key];
         if (typeof value === 'string') {
            permissions.push(value);
         } else if (typeof value === 'object' && value !== null) {
            permissions.push(...this.extractAllPermissions(value));
         }
      }

      return permissions;
   }

   /**
    * Ensures the admin role has all permissions defined in AppPermissions
    */
   private async hydrateAdminRole(): Promise<SyncData> {
      const result: SyncData = {
         totalPermissions: 0,
         addedPermissions: 0,
         errors: [],
      };

      try {
         const allPermissions = this.extractAllPermissions(AppPermissions)
            .filter(p => !EXCLUDED_PERMISSIONS.includes(p));
         result.totalPermissions = allPermissions.length;
         this.logger.log(`Found ${allPermissions.length} permissions defined in AppPermissions (${EXCLUDED_PERMISSIONS.length} excluded)`);

         const adminRole = await this.entities.roleManager.getById('admin');
         if (!adminRole) {
            const message = 'Admin role not found in database - skipping hydration';
            this.logger.warn(message);
            result.errors.push(message);
            return result;
         }

         if (adminRole.permissions === undefined) {
            adminRole.permissions = [];
         }

         let hasChanges = false;
         for (const permission of allPermissions) {
            if (!adminRole.permissions.includes(permission)) {
               adminRole.permissions.push(permission);
               hasChanges = true;
               result.addedPermissions++;
            }
         }

         if (hasChanges) {
            await this.entities.roleManager.replace(adminRole._id, adminRole);
            this.logger.log(`Updated admin role with ${result.addedPermissions} new permissions`);
         } else {
            this.logger.log('Admin role already has all permissions');
         }
      } catch (error) {
         result.errors.push(error.message);
         this.logger.error('Error hydrating admin role:', error);
      }

      return result;
   }
}
