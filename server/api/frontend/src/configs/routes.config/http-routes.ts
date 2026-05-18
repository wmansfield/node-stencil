import { lazy } from 'react';

import type { Routes } from '@/@types/routes';

const httpRoutes: Routes = [
   {
      key: 'accessDenied',
      path: `/access-denied`,
      component: lazy(() => import('@/views/others/AccessDenied/AccessDenied')),
      authority: [], //[ADMIN, USER],
      meta: {
         pageBackgroundType: 'plain',
         pageContainerType: 'contained',
      },
   },
];

export default httpRoutes;
