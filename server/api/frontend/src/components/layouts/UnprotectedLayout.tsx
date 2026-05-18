import authRoutes from '@/configs/routes.config/auth-routes';
import { useLocation } from 'react-router';
import AuthLayout from './AuthLayout';
import type { CommonProps } from '@/@types/common';

const UnprotectedLayout = ({ children }: CommonProps) => {
   const location = useLocation();

   const { pathname } = location;

   const isAuthPath = authRoutes.some(route => route.path === pathname);

   return <div className="flex flex-auto flex-col h-[100vh]">{isAuthPath ? <AuthLayout>{children}</AuthLayout> : children}</div>;
};

export default UnprotectedLayout;
