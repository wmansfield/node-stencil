import { lazy } from 'react';
import type { Routes } from '@/@types/routes';
const adminRoutes: Routes = [
   {
      key: 'adminTasks',
      path: 'admin/tasks',
      component: lazy(() => import('@/views/admin/tasks/home')),
      authority: [],
   },
];

export default adminRoutes;
