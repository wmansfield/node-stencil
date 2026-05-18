import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant';
import type { NavigationTree } from '@/@types/navigation';

const superCrudConfig: NavigationTree[] = [
   {
      key: 'superGlobalAccount',
      path: '/super/globalaccount',
      title: 'Global Accounts',
      translateKey: 'super.globalaccount',
      icon: 'settings',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
   {
      key: 'superGlobalSetting',
      path: '/super/globalsetting',
      title: 'Global Settings',
      translateKey: 'super.globalsetting',
      icon: 'settings',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
   {
      key: 'superJurisdiction',
      path: '/super/jurisdiction',
      title: 'Jurisdictions',
      translateKey: 'super.jurisdiction',
      icon: 'settings',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
   {
      key: 'superRole',
      path: '/super/role',
      title: 'Roles',
      translateKey: 'super.role',
      icon: 'settings',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
   {
      key: 'superTimezone',
      path: '/super/timezone',
      title: 'Timezones',
      translateKey: 'super.timezone',
      icon: 'settings',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
];

export default superCrudConfig;