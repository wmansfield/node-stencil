import Logo from '@/components/template/Logo';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage';
import { useThemeStore } from '@/store/themeStore';
import Button from '@/components/ui/Button';
import useAuth from '@/auth/useAuth';
import { useFirebase } from '@/auth/FirebaseProvider';
import React from 'react';
import { Navigate, useSearchParams } from 'react-router';
import appConfig from '@/configs/app.config';
import { REDIRECT_URL_KEY } from '@/constants/app.constant';

export const SignInBase = () => {
   const [message, setMessage] = useTimeOutMessage();

   const mode = useThemeStore(state => state.mode);
   const { authenticated, user, signOut, signInWithSSO, signInWithLocal, authError, clearAuthError } = useAuth();
   const { auth } = useFirebase();
   const [isLoading, setIsLoading] = React.useState(false);
   const [localUsername, setLocalUsername] = React.useState('');
   const [localPassword, setLocalPassword] = React.useState('');

   const isFirebaseMode = !!auth;

   React.useEffect(() => {
      if (authError) {
         setMessage(authError);
         setIsLoading(false);
         clearAuthError();
      }
   }, [authError, setMessage, clearAuthError]);

   const handleSSO = async () => {
      setIsLoading(true);
      try {
         await signInWithSSO();
      } catch (error: any) {
         setIsLoading(false);
         setMessage(error.message || 'Sign-in failed. Please try again.');
      }
   };

   const handleLocalSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!localUsername || !localPassword) {
         setMessage('Username and password are required.');
         return;
      }
      setIsLoading(true);
      try {
         await signInWithLocal(localUsername, localPassword);
      } catch (error: any) {
         setIsLoading(false);
         setMessage(error.response?.data?.message || error.message || 'Sign-in failed.');
      }
   };

   return (
      <>
         <div className="mb-8">
            <Logo type="streamline" mode={mode} imgClass="mx-auto" logoWidth={60} />
         </div>
         <div className="mb-10">
            <h2 className="mb-2">Welcome back!</h2>
            <p className="font-semibold heading-text">Sign in to continue.</p>
         </div>
         {!authenticated ? (
            <div className="flex flex-col gap-4">
               {message && (
                  <Alert showIcon className="mb-2" type="danger">
                     <span className="break-all">{message}</span>
                  </Alert>
               )}
               {isFirebaseMode ? (
                  <Button
                     block
                     variant="solid"
                     type="button"
                     disabled={isLoading}
                     onClick={handleSSO}
                     className="flex items-center justify-center gap-2"
                  >
                     {isLoading ? 'Signing in...' : 'Sign in with SSO'}
                  </Button>
               ) : (
                  <form onSubmit={handleLocalSignIn} className="flex flex-col gap-3">
                     <Input
                        placeholder="Username"
                        value={localUsername}
                        onChange={e => setLocalUsername(e.target.value)}
                        autoComplete="username"
                        disabled={isLoading}
                     />
                     <Input
                        type="password"
                        placeholder="Password"
                        value={localPassword}
                        onChange={e => setLocalPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={isLoading}
                     />
                     <Button block variant="solid" type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                     </Button>
                     <p className="text-center text-xs text-gray-400 mt-1">
                        Local development mode — Firebase not configured.
                     </p>
                  </form>
               )}
            </div>
         ) : (
            <div>
               <p>Welcome, {user?.userName || user?.email}!</p>
               <Button block variant="solid" type="button" onClick={() => signOut()}>
                  Sign Out
               </Button>
            </div>
         )}
      </>
   );
};

const SignIn = () => {
   const { authenticated } = useAuth();
   const [searchParams] = useSearchParams();

   if (authenticated) {
      const redirectUrl = searchParams.get(REDIRECT_URL_KEY);
      const target = redirectUrl && redirectUrl !== '/sign-in' ? redirectUrl : appConfig.authenticatedEntryPath;
      return <Navigate replace to={target} />;
   }

   return <SignInBase />;
};

export default SignIn;
