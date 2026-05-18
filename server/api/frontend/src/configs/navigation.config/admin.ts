import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant';
import type { NavigationTree } from '@/@types/navigation';
import { t } from 'i18next';

const adminConfig: NavigationTree[] = [
   {
      key: 'adminTasks',
      path: '/admin/tasks',
      title: 'Tasks',
      translateKey: 'nav.tasks',
      icon: 'tasks',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
   {
      key: 'adminNetwork',
      path: '/admin/network',
      title: 'Network',
      translateKey: 'nav.network',
      icon: 'network',
      type: NAV_ITEM_TYPE_ITEM,
      authority: [],
      subMenu: [],
   },
];

export default adminConfig;
