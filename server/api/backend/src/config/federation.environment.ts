/**
 * Static federation mode resolution. Resolved once at import time.
 *
 * This is the ONLY file in the federation layer that reads process.env.
 * In production, mode is always 'federated' regardless of FEDERATION_MODE.
 */
const isProduction = process.env.NODE_ENV === 'production';

export type FederationMode = 'federated' | 'development';

export const FederationEnvironment = Object.freeze({
   isProduction,
   mode: (isProduction
      ? 'federated'
      : process.env.FEDERATION_MODE === 'development'
         ? 'development'
         : 'federated') as FederationMode,
   isFederated: isProduction || process.env.FEDERATION_MODE !== 'development',
   isDevelopment: !isProduction && process.env.FEDERATION_MODE === 'development',
});
