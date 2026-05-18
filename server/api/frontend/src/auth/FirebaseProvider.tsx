import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface FirebaseContextType {
   app: FirebaseApp | null;
   auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, auth: null });

// Helper function to check if a value is a placeholder
const isPlaceholder = (value: string | undefined): boolean => {
   return !value || (value.startsWith('__') && value.endsWith('__'));
};

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
   const [app, setApp] = useState<FirebaseApp | null>(null);
   const [auth, setAuth] = useState<Auth | null>(null);

   useEffect(() => {
      // Initialize Firebase if not already initialized
      if (getApps().length === 0) {
         const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
         const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
         const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
         const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
         const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
         const appId = import.meta.env.VITE_FIREBASE_APP_ID;

         // Validate that all required config values are present and not placeholders
         if (
            isPlaceholder(apiKey) ||
            isPlaceholder(authDomain) ||
            isPlaceholder(projectId) ||
            isPlaceholder(storageBucket) ||
            isPlaceholder(messagingSenderId) ||
            isPlaceholder(appId)
         ) {
            console.error(
               'Firebase configuration is missing or incomplete. Please set the following environment variables:\n' +
                  'VITE_FIREBASE_API_KEY\n' +
                  'VITE_FIREBASE_AUTH_DOMAIN\n' +
                  'VITE_FIREBASE_PROJECT_ID\n' +
                  'VITE_FIREBASE_STORAGE_BUCKET\n' +
                  'VITE_FIREBASE_MESSAGING_SENDER_ID\n' +
                  'VITE_FIREBASE_APP_ID'
            );
            return;
         }

         const firebaseConfig = {
            apiKey,
            authDomain,
            projectId,
            storageBucket,
            messagingSenderId,
            appId,
         };

         try {
            // Initialize Firebase with the provided config
            // Note: Firebase may still attempt to fetch init.json from hosting domain,
            // but this is harmless - it will fall back to the provided config
            const firebaseApp = initializeApp(firebaseConfig);
            const firebaseAuth = getAuth(firebaseApp);

            setApp(firebaseApp);
            setAuth(firebaseAuth);
         } catch (error) {
            console.error('Failed to initialize Firebase:', error);
         }
      } else {
         const existingApp = getApps()[0];
         setApp(existingApp);
         setAuth(getAuth(existingApp));
      }
   }, []);

   return <FirebaseContext.Provider value={{ app, auth }}>{children}</FirebaseContext.Provider>;
}

export const useFirebase = () => useContext(FirebaseContext);
