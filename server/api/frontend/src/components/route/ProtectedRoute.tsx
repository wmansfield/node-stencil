import appConfig from '@/configs/app.config';
import { REDIRECT_URL_KEY } from '@/constants/app.constant';
import { Navigate, Outlet } from 'react-router';
import useAuth from '@/auth/useAuth';
import Loading from '@/components/shared/Loading';

const { unAuthenticatedEntryPath } = appConfig;

const ProtectedRoute = () => {
   const { authenticated: isAuthenticated } = useAuth();
   const isLoading = false; // Loading is handled by AuthProvider

   const pathName = location.pathname;

   const shouldRedirect = pathName !== '/' && pathName !== unAuthenticatedEntryPath;
   const getPathName = shouldRedirect ? `?${REDIRECT_URL_KEY}=${pathName}` : '';

   if (isLoading) {
      return <Loading loading={true} className="w-full" />;
   }

   if (!isAuthenticated) {
      return <Navigate replace to={`${unAuthenticatedEntryPath}${getPathName}`} />;
   }
   return <Outlet />;
};

export default ProtectedRoute;
