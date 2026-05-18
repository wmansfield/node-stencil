import { lazy } from 'react';
import type { Routes } from '@/@types/routes';

const authRoutes: Routes = [
   {
      key: 'signIn',
      path: `/sign-in`,
      component: lazy(() => import('@/views/auth/SignIn')),
      authority: [],
   },
];

export default authRoutes;
