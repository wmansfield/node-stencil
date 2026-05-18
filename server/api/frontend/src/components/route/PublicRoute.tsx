import { Navigate, Outlet } from 'react-router';
import appConfig from '@/configs/app.config';

const { authenticatedEntryPath } = appConfig;

const PublicRoute = () => {
   return <Outlet />;
};

export default PublicRoute;
