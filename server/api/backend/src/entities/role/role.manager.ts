import { Injectable } from '@nestjs/common';
import { RoleManagerBase } from './role.manager.base';
import { MongoConnectionProvider } from 'src/shared/mongo/mongo-connection.provider';
import { DependencyCoordinator } from '../dependencies/dependency-coordinator';
import { EntityRegistry } from '../entity.registry';
import { MemoryCache } from 'src/shared/cache/memory-cache';

@Injectable()
export class RoleManager extends RoleManagerBase {
   constructor(
      connectionProvider: MongoConnectionProvider,
      entities: EntityRegistry,
      dependencyCoordinator: DependencyCoordinator,
      memoryCache: MemoryCache
   ) {
      super(connectionProvider, entities, dependencyCoordinator, memoryCache);
   }

   async getPermissionsForRolesCached(role_names?: string[]): Promise<string[]> {
      const result: string[] = [];

      if (role_names) {
         for (const role_name of role_names) {
            const permissions = await this.getPermissionsForRoleCached(role_name);
            if (permissions && permissions.length > 0) {
               result.push(...permissions);
            }
         }
      }

      return result;
   }

   async getPermissionsForRole(role_name: string): Promise<string[]> {
      const role = await this.getById(role_name);
      if (role) {
         return role.permissions;
      }
      return [];
   }
   async getPermissionsForRoleCached(role_name: string): Promise<string[]> {
      const cached = await this.memoryCache.getOrFetch15(`RoleManager:getPermissionsForRole:${role_name}`, () =>
         this.getPermissionsForRole(role_name)
      );
      return cached.value;
   }

   async hasPermissionCached(requiredPermission: string, roles?: string[]): Promise<boolean> {
      if (roles === undefined) {
         return false;
      }

      const permissions = await this.getPermissionsForRolesCached(roles);
      if (permissions.includes(requiredPermission)) {
         return true;
      }

      return false;
   }
}
