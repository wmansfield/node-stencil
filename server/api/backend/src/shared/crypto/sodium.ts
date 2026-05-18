// crypto/sodium.ts
const sodium = require('libsodium-wrappers');

// Internal ready flag
let initialized = false;

/**
 * Initializes libsodium exactly once.
 * Should be called during server bootstrap.
 */
export async function initSodium() {
   if (!initialized) {
      await sodium.ready;
      initialized = true;
   }
}

/**
 * Accessor for sodium. Throws if used before initialization.
 */
export function getSodium() {
   if (!initialized) {
      throw new Error('libsodium not initialized. Call initSodium() during server startup.');
   }
   return sodium;
}
