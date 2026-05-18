import { NAV_ITEM_TYPE_COLLAPSE, NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_TITLE } from '@/constants/navigation.constant';

import type { NavigationTree } from '@/@types/navigation';
import superCrudConfig from './super-crud';
import adminConfig from './admin';

const navigationConfig: NavigationTree[] = [
   {
      key: 'home',
      path: '/home',
      title: 'Home',
      translateKey: 'nav.home',
      icon: 'home',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
   {
      key: 'admin',
      path: '/admin',
      title: 'Admin',
      translateKey: 'nav.admin',
      icon: 'admin',
      type: NAV_ITEM_TYPE_COLLAPSE,
      authority: [],
      subMenu: [...adminConfig],
   },
   {
      key: 'super',
      path: '/super',
      title: 'Danger Zone',
      translateKey: 'nav.super',
      icon: 'super',
      type: NAV_ITEM_TYPE_COLLAPSE,
      authority: [],
      subMenu: [...superCrudConfig],
   },
];

export default navigationConfig;
