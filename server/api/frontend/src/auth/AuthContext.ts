import { createContext } from 'react';
import type { User } from '@/@types/auth';

type Auth = {
   authenticated: boolean;
   user: User;
   signOut: () => void;
   signInWithSSO: () => Promise<any>;
   signInWithLocal: (username: string, password: string) => Promise<void>;
   authError: string | null;
   clearAuthError: () => void;
};

const AuthContext = createContext<Auth>({
   authenticated: false,
   user: {},
   signOut: () => {},
   signInWithSSO: async () => {},
   signInWithLocal: async () => {},
   authError: null,
   clearAuthError: () => {},
});

export default AuthContext;
