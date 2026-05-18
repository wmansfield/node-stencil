import { lazy } from 'react';
import httpRoutes from './http-routes';
import authRoutes from './auth-routes';

import type { Routes } from '@/@types/routes';
import superCrudRoutes from './super-crud.routes';
import adminRoutes from './admin-routes';

export const anonymousRoutes: Routes = [...authRoutes, ...httpRoutes];
export const protectedRoutes: Routes = [
   {
      key: 'home',
      path: '/home',
      component: lazy(() => import('@/views/Home')),
      authority: [],
   },
   ...adminRoutes,
   ...superCrudRoutes,
];
