import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { SynchronizableEntityIsolated, SynchronizableEntityShared } from 'src/shared/managers/synchronized-entity';

import type { GlobalSettingManager } from './globalsetting/globalsetting.manager';
import type { TimezoneManager } from './timezone/timezone.manager';
import type { RoleManager } from './role/role.manager';
import type { GlobalAccountManager } from './globalaccount/globalaccount.manager';
import type { JurisdictionManager } from './jurisdiction/jurisdiction.manager';
import type { JurisdictionSettingManager } from './jurisdictionsetting/jurisdictionsetting.manager';
import type { JurisdictionAssetManager } from './jurisdictionasset/jurisdictionasset.manager';
import type { AccountManager } from './account/account.manager';
import type { WidgetManager } from './widget/widget.manager';


@Injectable()
export class EntityRegistry implements OnModuleInit {
   constructor(private moduleRef: ModuleRef) {}
   
   private _globalSettingManager!: GlobalSettingManager;
   private _timezoneManager!: TimezoneManager;
   private _roleManager!: RoleManager;
   private _globalAccountManager!: GlobalAccountManager;
   private _jurisdictionManager!: JurisdictionManager;
   private _jurisdictionSettingManager!: JurisdictionSettingManager;
   private _jurisdictionAssetManager!: JurisdictionAssetManager;
   private _accountManager!: AccountManager;
   private _widgetManager!: WidgetManager;

   onModuleInit() {
      // Optionally, eagerly resolve all managers here if you want
   }

   
   get globalSettingManager(): GlobalSettingManager {
      if (!this._globalSettingManager) {
         try {
            this._globalSettingManager = this.moduleRef.get('GlobalSettingManager', { strict: false });
         } catch (error) {
            throw new Error(`GlobalSettingManager not available: ${error.message}`);
         }
      }
      return this._globalSettingManager;
   }
   
   get timezoneManager(): TimezoneManager {
      if (!this._timezoneManager) {
         try {
            this._timezoneManager = this.moduleRef.get('TimezoneManager', { strict: false });
         } catch (error) {
            throw new Error(`TimezoneManager not available: ${error.message}`);
         }
      }
      return this._timezoneManager;
   }
   
   get roleManager(): RoleManager {
      if (!this._roleManager) {
         try {
            this._roleManager = this.moduleRef.get('RoleManager', { strict: false });
         } catch (error) {
            throw new Error(`RoleManager not available: ${error.message}`);
         }
      }
      return this._roleManager;
   }
   
   get globalAccountManager(): GlobalAccountManager {
      if (!this._globalAccountManager) {
         try {
            this._globalAccountManager = this.moduleRef.get('GlobalAccountManager', { strict: false });
         } catch (error) {
            throw new Error(`GlobalAccountManager not available: ${error.message}`);
         }
      }
      return this._globalAccountManager;
   }
   
   get jurisdictionManager(): JurisdictionManager {
      if (!this._jurisdictionManager) {
         try {
            this._jurisdictionManager = this.moduleRef.get('JurisdictionManager', { strict: false });
         } catch (error) {
            throw new Error(`JurisdictionManager not available: ${error.message}`);
         }
      }
      return this._jurisdictionManager;
   }
   
   get jurisdictionSettingManager(): JurisdictionSettingManager {
      if (!this._jurisdictionSettingManager) {
         try {
            this._jurisdictionSettingManager = this.moduleRef.get('JurisdictionSettingManager', { strict: false });
         } catch (error) {
            throw new Error(`JurisdictionSettingManager not available: ${error.message}`);
         }
      }
      return this._jurisdictionSettingManager;
   }
   
   get jurisdictionAssetManager(): JurisdictionAssetManager {
      if (!this._jurisdictionAssetManager) {
         try {
            this._jurisdictionAssetManager = this.moduleRef.get('JurisdictionAssetManager', { strict: false });
         } catch (error) {
            throw new Error(`JurisdictionAssetManager not available: ${error.message}`);
         }
      }
      return this._jurisdictionAssetManager;
   }
   
   get accountManager(): AccountManager {
      if (!this._accountManager) {
         try {
            this._accountManager = this.moduleRef.get('AccountManager', { strict: false });
         } catch (error) {
            throw new Error(`AccountManager not available: ${error.message}`);
         }
      }
      return this._accountManager;
   }
   
   get widgetManager(): WidgetManager {
      if (!this._widgetManager) {
         try {
            this._widgetManager = this.moduleRef.get('WidgetManager', { strict: false });
         } catch (error) {
            throw new Error(`WidgetManager not available: ${error.message}`);
         }
      }
      return this._widgetManager;
   }
   

   getSharedSynchronizers(): SynchronizableEntityShared[] {
      return [
      ];
   }

   getIsolatedSynchronizers(): SynchronizableEntityIsolated[] {
      return [
         this.accountManager,
         this.widgetManager,
      ];
   }
}