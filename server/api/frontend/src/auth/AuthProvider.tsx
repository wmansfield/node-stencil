import { useRef, useImperativeHandle, useEffect, useState } from 'react';
import AuthContext from './AuthContext';
import appConfig from '@/configs/app.config';
import { setTokenProvider, FirebaseTokenProvider, StaticTokenProvider } from '@/stencil/apiService';
import { REDIRECT_URL_KEY } from '@/constants/app.constant';
import { useNavigate } from 'react-router';
import type { ReactNode, Ref } from 'react';
import type { NavigateFunction } from 'react-router';
import { useFirebase } from './FirebaseProvider';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { protectedRoutes, anonymousRoutes } from '@/configs/routes.config/routes.config';
import { authEndpoints } from '@/stencil/endpoints/features/user/authApi';
import { useAppDispatch } from '@/store/rootStore';
import { Routes } from '@/@types/routes';
import Axios from 'axios';

const LOCAL_TOKEN_KEY = 'stencil_dev_token';

function decodeJwtPayload(token: string): Record<string, any> {
   try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
   } catch {
      return {};
   }
}

function isTokenExpired(token: string): boolean {
   const payload = decodeJwtPayload(token);
   if (!payload.exp) {
      return false;
   }
   return Date.now() >= payload.exp * 1000;
}

type AuthState =
   | { mode: 'firebase'; firebaseUser: FirebaseUser; claims: Record<string, any> }
   | { mode: 'local'; sub: string; email: string; token: string }
   | null;

type AuthProviderProps = { children: ReactNode };

export type IsolatedNavigatorRef = {
   navigate: NavigateFunction;
};

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
   const navigate = useNavigate();

   useImperativeHandle(ref, () => {
      return {
         navigate,
      };
   }, [navigate]);

   return <></>;
};

function AuthProvider({ children }: AuthProviderProps) {
   const { auth } = useFirebase();
   const dispatch = useAppDispatch();
   const [authState, setAuthState] = useState<AuthState>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [authError, setAuthError] = useState<string | null>(null);
   const navigatorRef = useRef<IsolatedNavigatorRef>(null);

   // Keep the token provider in sync with auth state
   useEffect(() => {
      if (authState?.mode === 'firebase' && auth) {
         setTokenProvider(new FirebaseTokenProvider(auth, authState.firebaseUser));
      } else if (authState?.mode === 'local') {
         setTokenProvider(new StaticTokenProvider(authState.token));
      }
   }, [authState, auth]);

   // Firebase auth listener — also handles local token restoration when Firebase is absent
   useEffect(() => {
      if (!auth) {
         const savedToken = localStorage.getItem(LOCAL_TOKEN_KEY);
         if (savedToken && !isTokenExpired(savedToken)) {
            const payload = decodeJwtPayload(savedToken);
            setAuthState({
               mode: 'local',
               sub: payload.sub ?? 'dev',
               email: payload.email ?? '',
               token: savedToken,
            });
         }
         setIsLoading(false);
         return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
         if (firebaseUser) {
            const isPermitted = await verifyAccountPermitted(firebaseUser);

            if (!isPermitted) {
               console.warn('Account access denied by server. Signing out...');
               setAuthError('Access denied. Your account does not have permission to sign in.');
               await signOut(auth);
               setAuthState(null);
               setIsLoading(false);
               return;
            }

            setAuthError(null);
            const tokenResult = await firebaseUser.getIdTokenResult(true);
            setAuthState({ mode: 'firebase', firebaseUser, claims: tokenResult.claims });
         } else {
            setAuthState(null);
         }

         setIsLoading(false);
      });

      return () => unsubscribe();
   }, [auth]);

   const verifyAccountPermitted = async (firebaseUser: FirebaseUser): Promise<boolean> => {
      try {
         const token = await firebaseUser.getIdToken();
         const response = await dispatch(authEndpoints.getSelf.initiate(token));

         if (response.data?.success === true && response.data.item) {
            return true;
         }
         return false;
      } catch (error) {
         console.error('Failed to verify account permission:', error);
         return false;
      }
   };

   const redirect = () => {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const redirectUrl = params.get(REDIRECT_URL_KEY);

      if (redirectUrl) {
         navigatorRef.current?.navigate(redirectUrl);
         return;
      }

      const currentPath = window.location.pathname;
      const isRootPath = currentPath === '/';
      const isValidAnonymousRoute = isRouteInConfig(currentPath, anonymousRoutes);
      const isValidProtectedRoute = isRouteInConfig(currentPath, protectedRoutes);

      if (isRootPath || (!isValidProtectedRoute && !isValidAnonymousRoute)) {
         navigatorRef.current?.navigate(appConfig.authenticatedEntryPath);
      }
   };

   const isRouteInConfig = (currentPath: string, routes: Routes, parentPath: string = ''): boolean => {
      const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;

      return routes.some(route => {
         let fullPath: string;
         if (parentPath) {
            fullPath = route.path === '' ? parentPath : `${parentPath}/${route.path}`.replace(/\/+/g, '/');
         } else {
            fullPath = route.path;
         }

         const normalizedFullPath = fullPath.startsWith('/') ? fullPath.slice(1) : fullPath;

         if (normalizedFullPath === normalizedCurrentPath) {
            return true;
         }

         const escapedPath = normalizedFullPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         const routeRegex = new RegExp('^' + escapedPath.replace(/:[^/]+/g, '[^/]+') + '$');
         if (routeRegex.test(normalizedCurrentPath)) {
            return true;
         }

         if (route.children && route.children.length > 0) {
            return isRouteInConfig(currentPath, route.children, fullPath);
         }

         return false;
      });
   };

   const handleSignOut = async () => {
      if (authState?.mode === 'firebase' && auth) {
         await signOut(auth);
      }
      if (authState?.mode === 'local') {
         localStorage.removeItem(LOCAL_TOKEN_KEY);
      }
      setAuthState(null);
   };

   const handleSSOSignIn = async () => {
      if (!auth) {
         throw new Error('Firebase is not initialized');
      }

      // GoogleAuthProvider is the default — swap for GithubAuthProvider, OAuthProvider, etc.
      const provider = new GoogleAuthProvider();

      try {
         await signInWithPopup(auth, provider);
         // onAuthStateChanged handles the rest
      } catch (error: any) {
         if (error.code === 'auth/popup-closed-by-user') {
            return null;
         }
         console.error('SSO sign-in error:', error);
         throw error;
      }
   };

   const handleLocalSignIn = async (username: string, password: string): Promise<void> => {
      const apiBase = appConfig.apiBaseUrl.replace(/\/$/, '');
      const response = await Axios.post(`${apiBase}/v1/auth/dev-token`, { username, password });
      const token: string = response.data?.token;
      if (!token) {
         throw new Error('No token returned from dev-token endpoint');
      }
      const payload = decodeJwtPayload(token);
      localStorage.setItem(LOCAL_TOKEN_KEY, token);
      setAuthState({
         mode: 'local',
         sub: payload.sub ?? username,
         email: payload.email ?? `${username}@dev.local`,
         token,
      });
   };

   // Redirect after auth state is established
   useEffect(() => {
      if (authState) {
         redirect();
      }
   }, [authState]);

   const isAuthenticated = !!authState;

   const clearAuthError = () => {
      setAuthError(null);
   };

   const user = authState
      ? {
           avatar: authState.mode === 'firebase' ? (authState.firebaseUser.photoURL ?? '') : '',
           userName: authState.mode === 'firebase' ? (authState.firebaseUser.displayName ?? '') : authState.sub,
           email: authState.mode === 'firebase' ? (authState.firebaseUser.email ?? '') : authState.email,
           userId: authState.mode === 'firebase' ? authState.firebaseUser.uid : authState.sub,
           authority: authState.mode === 'firebase' ? ((authState.claims?.roles as string[]) ?? []) : ['dev'],
        }
      : { avatar: '', userName: '', email: '', userId: '', authority: [] };

   return (
      <AuthContext.Provider
         value={{
            authenticated: isAuthenticated,
            user,
            signOut: handleSignOut,
            signInWithSSO: handleSSOSignIn,
            signInWithLocal: handleLocalSignIn,
            authError,
            clearAuthError,
         }}
      >
         {children}
         <IsolatedNavigator ref={navigatorRef} />
      </AuthContext.Provider>
   );
}

export default AuthProvider;
