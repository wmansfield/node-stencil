import { lazy } from 'react';
import type { Routes } from '@/@types/routes';
import { ADMIN } from '@/constants/roles.constant';
const adminRoutes: Routes = [
   {
      key: 'adminTasks',
      path: 'admin/tasks',
      component: lazy(() => import('@/views/admin/tasks/home')),
      authority: [],
   },
   {
      key: 'adminNetwork',
      path: 'admin/network',
      component: lazy(() => import('@/views/admin/network/NetworkDashboard')),
      authority: [],
   },
];

export default adminRoutes;
