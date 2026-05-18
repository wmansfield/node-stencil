import { lazy } from 'react';
import type { Routes } from '@/@types/routes';

const superCrudRoutes: Routes = [{
      key: 'superGlobalAccount',
      path: 'super/globalaccount',
      component: lazy(() => import('@/views/super/crud/globalaccount/GlobalAccountList')),
      authority: [],
   },
   {
      key: 'superGlobalSetting',
      path: 'super/globalsetting',
      component: lazy(() => import('@/views/super/crud/globalsetting/GlobalSettingList')),
      authority: [],
   },
   {
      key: 'superJurisdiction',
      path: 'super/jurisdiction',
      component: lazy(() => import('@/views/super/crud/jurisdiction/JurisdictionList')),
      authority: [],
   },
   {
      key: 'superJurisdictionDetail',
      path: 'super/jurisdiction/:jurisdiction_id',
      component: lazy(() => import('@/views/super/crud/jurisdiction/JurisdictionDetail')),
      authority: [],
   },
   {
      key: 'superRole',
      path: 'super/role',
      component: lazy(() => import('@/views/super/crud/role/RoleList')),
      authority: [],
   },
   {
      key: 'superTimezone',
      path: 'super/timezone',
      component: lazy(() => import('@/views/super/crud/timezone/TimezoneList')),
      authority: [],
   },
   {
      key: 'superAccount',
      path: 'super/jurisdiction/:jurisdiction_id/account',
      component: lazy(() => import('@/views/super/crud/account/AccountList')),
      authority: [],
   },
   {
      key: 'superAccountDetail',
      path: 'super/jurisdiction/:jurisdiction_id/account/:_id',
      component: lazy(() => import('@/views/super/crud/account/AccountDetail')),
      authority: [],
   },
   {
      key: 'superJurisdictionAsset',
      path: 'super/jurisdiction/:jurisdiction_id/jurisdictionasset',
      component: lazy(() => import('@/views/super/crud/jurisdictionasset/JurisdictionAssetList')),
      authority: [],
   },
   {
      key: 'superJurisdictionSetting',
      path: 'super/jurisdiction/:jurisdiction_id/jurisdictionsetting',
      component: lazy(() => import('@/views/super/crud/jurisdictionsetting/JurisdictionSettingList')),
      authority: [],
   },
   {
      key: 'superWidget',
      path: 'super/jurisdiction/:jurisdiction_id/widget',
      component: lazy(() => import('@/views/super/crud/widget/WidgetList')),
      authority: [],
   },
   {
      key: 'superWidgetDetail',
      path: 'super/jurisdiction/:jurisdiction_id/widget/:_id',
      component: lazy(() => import('@/views/super/crud/widget/WidgetDetail')),
      authority: [],
   },
   
];

export default superCrudRoutes;