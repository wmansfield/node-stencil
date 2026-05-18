export type AppConfig = {
   apiBaseUrl: string;
   adminGateToken: string;
   authenticatedEntryPath: string;
   unAuthenticatedEntryPath: string;
   locale: string;
   accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies';
   activeNavTranslation: boolean;
};

const appConfig: AppConfig = {
   apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '__API_BASE_URL__',
   adminGateToken: import.meta.env.VITE_ADMIN_GATE_TOKEN || '__ADMIN_GATE_TOKEN__',
   authenticatedEntryPath: '/home',
   unAuthenticatedEntryPath: '/sign-in',
   locale: 'en',
   accessTokenPersistStrategy: 'cookies',
   activeNavTranslation: false,
};

export default appConfig;
