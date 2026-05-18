import { Routes, Route, Navigate, Outlet, useOutlet } from 'react-router';
import appConfig from '@/configs/app.config';
import useAuth from '@/auth/useAuth';
import AuthorityGuard from './AuthorityGuard';
import PageContainer from '@/components/template/PageContainer';
import AppRoute from './AppRoute';
import ProtectedRoute from './ProtectedRoute';
import { protectedRoutes, anonymousRoutes } from '@/configs/routes.config/routes.config';
import type { LayoutType } from '@/@types/theme';
import type { Route as RouteType } from '@/@types/routes';

interface ViewsProps {
   pageContainerType?: 'default' | 'gutterless' | 'contained';
   layout?: LayoutType;
}

type AllRoutesProps = ViewsProps;

const { authenticatedEntryPath } = appConfig;

interface RenderRouteProps {
   route: RouteType;
   index?: number;
   userAuthority: string[];
   props: AllRoutesProps;
   isNested?: boolean;
}

/**
 * Component that conditionally renders parent component only when no child route is active
 */
const NestedRouteWrapper = ({
   route,
   userAuthority,
   props,
   isNested,
}: {
   route: RouteType;
   userAuthority: string[];
   props: AllRoutesProps;
   isNested: boolean;
}) => {
   const outlet = useOutlet();

   const content = outlet ? (
      // Child route is active, only render the outlet
      <Outlet />
   ) : route.component ? (
      // No child route active, render the parent component if it exists
      <AppRoute routeKey={route.key} component={route.component} {...route.meta} />
   ) : // No component and no outlet - this shouldn't happen, but handle gracefully
   null;

   // Only wrap in PageContainer if this is a top-level route (not nested)
   // Nested routes should not add another PageContainer to avoid double rendering
   if (isNested) {
      return (
         <AuthorityGuard userAuthority={userAuthority} authority={route.authority}>
            {content}
         </AuthorityGuard>
      );
   }

   return (
      <AuthorityGuard userAuthority={userAuthority} authority={route.authority}>
         <PageContainer {...props} {...route.meta}>
            {content}
         </PageContainer>
      </AuthorityGuard>
   );
};

const renderRoute = ({ route, index, userAuthority, props, isNested = false }: RenderRouteProps) => {
   const hasChildren = route.children && route.children.length > 0;

   if (hasChildren) {
      return (
         <Route
            key={route.key + (index ?? '')}
            path={route.path}
            element={<NestedRouteWrapper route={route} userAuthority={userAuthority} props={props} isNested={isNested} />}
         >
            {route.children?.map((childRoute, childIndex) =>
               renderRoute({
                  route: childRoute,
                  index: childIndex,
                  userAuthority,
                  props,
                  isNested: true,
               })
            )}
         </Route>
      );
   }

   // For nested child routes, don't wrap in PageContainer (parent already has it)
   // These routes must have a component (no children means they're leaf routes)
   if (isNested) {
      if (!route.component) {
         throw new Error(`Route ${route.key} is missing a component`);
      }
      return (
         <Route
            key={route.key + (index ?? '')}
            path={route.path}
            element={
               <AuthorityGuard userAuthority={userAuthority} authority={route.authority}>
                  <AppRoute routeKey={route.key} component={route.component} {...route.meta} />
               </AuthorityGuard>
            }
         />
      );
   }

   // Top-level routes without children must have a component
   if (!route.component) {
      throw new Error(`Route ${route.key} is missing a component`);
   }

   return (
      <Route
         key={route.key + (index ?? '')}
         path={route.path}
         element={
            <AuthorityGuard userAuthority={userAuthority} authority={route.authority}>
               <PageContainer {...props} {...route.meta}>
                  <AppRoute routeKey={route.key} component={route.component} {...route.meta} />
               </PageContainer>
            </AuthorityGuard>
         }
      />
   );
};

const AllRoutes = (props: AllRoutesProps) => {
   const { user } = useAuth();
   const userAuthority = user?.authority || [];

   return (
      <Routes>
         {anonymousRoutes.map(route => {
            if (!route.component) {
               throw new Error(`Route ${route.key} is missing a component`);
            }
            return (
               <Route key={route.path} path={route.path} element={<AppRoute routeKey={route.key} component={route.component} {...route.meta} />} />
            );
         })}

         <Route path="/" element={<ProtectedRoute />}>
            {protectedRoutes.map((route, index) => {
               if (!route.component) {
                  throw new Error(`Route ${route.key} is missing a component`);
               }
               return (
                  <Route
                     key={route.key + index}
                     path={route.path}
                     element={
                        <AuthorityGuard userAuthority={userAuthority} authority={route.authority}>
                           <PageContainer {...props} {...route.meta}>
                              <AppRoute routeKey={route.key} component={route.component} {...route.meta} />
                           </PageContainer>
                        </AuthorityGuard>
                     }
                  />
               );
            })}
            <Route path="/" element={<Navigate replace to={authenticatedEntryPath} />} />
            <Route path="*" element={<Navigate replace to="/" />} />
         </Route>
      </Routes>
   );
};

export default AllRoutes;
