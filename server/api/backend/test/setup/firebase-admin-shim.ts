// firebase-admin pulls in an ESM-only dependency (jose via jwks-rsa) that Jest's CommonJS runtime
// cannot load. e2e tests authenticate through TestJwtMiddleware and never construct
// FirebaseAuthProvider; jest-e2e.json maps 'firebase-admin/app' and 'firebase-admin/auth' here so
// the provider module can still be imported. Any call fails loudly.
function unavailable(): never {
   throw new Error('firebase-admin is not available in e2e tests; tests use local auth.');
}

export const cert = unavailable;
export const getApps = unavailable;
export const initializeApp = unavailable;
export const getAuth = unavailable;
