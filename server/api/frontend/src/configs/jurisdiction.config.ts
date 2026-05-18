export type KnownJurisdiction = 'US' | 'CA' | 'UK' | 'EU';

const JURISDICTION_URLS: Record<KnownJurisdiction, string> = {
   US: 'https://api-us.your-domain.com/api/',
   CA: 'https://api-ca.your-domain.com/api/',
   UK: 'https://api-uk.your-domain.com/api/',
   EU: 'https://api-eu.your-domain.com/api/',
};

const ADMIN_ROUTE_PREFIX = 'admin/';

/**
 * Resolves the API base URL for a request URL by checking if it targets
 * a known jurisdiction (e.g. `admin/UK/account/find` → UK API).
 * Returns null if the URL doesn't match a jurisdiction, meaning the
 * default base URL should be used.
 */
export function resolveJurisdictionBaseUrl(endpointUrl: string): string | null {
   if (window.location.hostname === 'localhost') {
      return null;
   }
   if (!endpointUrl.startsWith(ADMIN_ROUTE_PREFIX)) {
      return null;
   }
   const afterAdmin = endpointUrl.substring(ADMIN_ROUTE_PREFIX.length);
   const slash = afterAdmin.indexOf('/');
   if (slash === -1) {
      return null;
   }
   const segment = afterAdmin.substring(0, slash) as KnownJurisdiction;
   return JURISDICTION_URLS[segment] ?? null;
}
