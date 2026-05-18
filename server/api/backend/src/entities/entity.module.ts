import { forwardRef, DynamicModule, Module } from '@nestjs/common';
import { MongoModule } from 'src/shared/mongo/mongo.module';
import { AppConfigModule } from 'src/config/config.module';


import { GlobalSettingModule } from './globalsetting/globalsetting.module';
import { TimezoneModule } from './timezone/timezone.module';
import { RoleModule } from './role/role.module';
import { GlobalAccountModule } from './globalaccount/globalaccount.module';
import { JurisdictionModule } from './jurisdiction/jurisdiction.module';
import { JurisdictionSettingModule } from './jurisdictionsetting/jurisdictionsetting.module';
import { JurisdictionAssetModule } from './jurisdictionasset/jurisdictionasset.module';
import { AccountModule } from './account/account.module';
import { WidgetModule } from './widget/widget.module';

const ENTITY_MODULES = [
   GlobalSettingModule,
   TimezoneModule,
   RoleModule,
   GlobalAccountModule,
   JurisdictionModule,
   JurisdictionSettingModule,
   JurisdictionAssetModule,
   AccountModule,
   WidgetModule,
];

@Module({})
export class EntitiesModule {
   static forRoot(): DynamicModule {
      return {
         module: EntitiesModule,
         imports: [
            // standard
            forwardRef(() => AppConfigModule),
            forwardRef(() => MongoModule),
            // entities
            ...ENTITY_MODULES.map(module => forwardRef(() => module)),
         ],
         exports: [...ENTITY_MODULES],
         providers: [],
      };
   }
}