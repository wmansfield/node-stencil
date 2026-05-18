const IMAGE_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
   // JPEG: FF D8 FF
   { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
   // PNG: 89 50 4E 47 0D 0A 1A 0A
   { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
   // GIF87a / GIF89a
   { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
   // WebP: RIFF....WEBP
   { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

const WEBP_MARKER = Buffer.from('WEBP');

const ALLOWED_IMAGE_MIMES = new Set([
   'image/jpeg',
   'image/png',
   'image/gif',
   'image/webp',
]);

/**
 * Minimum bytes needed to reliably detect all supported image formats.
 * WebP requires 12 bytes (RIFF + 4-byte size + WEBP marker).
 */
export const MAGIC_BYTE_LENGTH = 12;

/**
 * Detect image MIME type from the first bytes of a file using magic byte signatures.
 * Returns the detected MIME type or null if the content doesn't match any known image format.
 */
export function detectImageType(header: Buffer): string | null {
   if (!header || header.length < 4) {
      return null;
   }

   for (const sig of IMAGE_SIGNATURES) {
      const offset = sig.offset ?? 0;
      if (header.length < offset + sig.bytes.length) continue;

      let match = true;
      for (let i = 0; i < sig.bytes.length; i++) {
         if (header[offset + i] !== sig.bytes[i]) {
            match = false;
            break;
         }
      }

      if (!match) continue;

      // WebP needs secondary check: bytes 8-11 must be "WEBP"
      if (sig.mime === 'image/webp') {
         if (header.length >= 12 && header.subarray(8, 12).equals(WEBP_MARKER)) {
            return 'image/webp';
         }
         continue;
      }

      return sig.mime;
   }

   return null;
}

/**
 * Returns true if the header bytes match a supported image format.
 */
export function isValidImageContent(header: Buffer): boolean {
   return detectImageType(header) !== null;
}

/**
 * Returns true if the given MIME string is in the allowed image set.
 */
export function isAllowedImageMime(mime: string): boolean {
   return ALLOWED_IMAGE_MIMES.has(mime);
}

// ── Encrypted asset envelope ────────────────────────────────────────

/**
 * Encrypted asset envelope: "UVLR" magic (4 bytes) + version (1) + flags (1).
 * Must match the client-side CryptoStream envelope exactly.
 */
const ENCRYPTED_ENVELOPE_MAGIC = Buffer.from([0x55, 0x56, 0x4C, 0x52]);
const ENCRYPTED_ENVELOPE_VERSION = 0x01;
export const ENCRYPTED_ENVELOPE_LENGTH = 6;

/**
 * Validates that the header bytes begin with the UVLR encrypted asset envelope.
 * Returns true if magic and version match.
 */
export function isValidEncryptedEnvelope(header: Buffer): boolean {
   if (!header || header.length < ENCRYPTED_ENVELOPE_LENGTH) {
      return false;
   }
   return (
      header[0] === ENCRYPTED_ENVELOPE_MAGIC[0] &&
      header[1] === ENCRYPTED_ENVELOPE_MAGIC[1] &&
      header[2] === ENCRYPTED_ENVELOPE_MAGIC[2] &&
      header[3] === ENCRYPTED_ENVELOPE_MAGIC[3] &&
      header[4] === ENCRYPTED_ENVELOPE_VERSION
   );
}
