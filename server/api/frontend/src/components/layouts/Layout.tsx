import { Suspense, lazy, useState, useEffect } from 'react';
import Loading from '@/components/shared/Loading';
import type { CommonProps } from '@/@types/common';
import { useThemeStore } from '@/store/themeStore';
import ProtectedLayout from './ProtectedLayout';
import UnprotectedLayout from './UnprotectedLayout';
import useAuth from '@/auth/useAuth';
import { useLocation } from 'react-router';

const Modal = lazy(() => import('@/components/ui/Dialog/Modal'));

const Layout = ({ children }: CommonProps) => {
   const location = useLocation();
   const { pathname } = location;

   const layoutType = useThemeStore(state => state.layout.type);
   const { authenticated: isAuthenticated } = useAuth();
   // Note: Loading state is handled by AuthProvider, but we show loading immediately
   // since AuthProvider manages the auth state
   const isLoading = false;

   // check for authentication
   if (isLoading) {
      return (
         <div className="flex flex-auto flex-col h-[100vh]">
            <Loading loading={true} />
         </div>
      );
   }

   // fork as needed
   return (
      <Suspense
         fallback={
            <div className="flex flex-auto flex-col h-[100vh]">
               <Loading loading={true} />
            </div>
         }
      >
         {isAuthenticated ? <ProtectedLayout layoutType={layoutType}>{children}</ProtectedLayout> : <UnprotectedLayout>{children}</UnprotectedLayout>}
      </Suspense>
   );
};

export default Layout;
