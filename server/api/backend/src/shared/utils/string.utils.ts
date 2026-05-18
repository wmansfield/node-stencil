/**
 * String utility functions
 */

/**
 * Checks if a string is null, undefined, empty, or contains only whitespace characters.
 * Equivalent to C#'s string.IsNullOrWhiteSpace()
 * @param value - The string to check
 * @returns true if the string is null, undefined, empty, or whitespace-only; false otherwise
 */
export function isNullOrWhiteSpace(value: string | null | undefined): boolean {
   return value === null || value === undefined || value.trim().length === 0;
}

/**
 * Checks if a string is null or undefined (but allows empty strings and whitespace)
 * @param value - The string to check
 * @returns true if the string is null or undefined; false otherwise
 */
export function isNullOrUndefined(value: string | null | undefined): boolean {
   return value === null || value === undefined;
}

/**
 * Checks if a string is empty or contains only whitespace characters (but allows null/undefined)
 * @param value - The string to check
 * @returns true if the string is empty or whitespace-only; false otherwise
 */
export function isEmptyOrWhiteSpace(value: string | null | undefined): boolean {
   return value !== null && value !== undefined && value.trim().length === 0;
}

/**
 * Safely trims a string, handling null/undefined values
 * @param value - The string to trim
 * @returns The trimmed string, or empty string if input is null/undefined
 */
export function trimSafe(value: string | null | undefined): string {
   return value?.trim() || '';
}

/**
 * Safely converts a value to string, handling null/undefined values
 * @param value - The value to convert
 * @returns The string representation, or empty string if input is null/undefined
 */
export function toStringSafe(value: any): string {
   return value?.toString() || '';
}

/**
 * Sanitizes HTML content by encoding/decoding special characters and removing potentially dangerous content
 * @param text - The text to sanitize
 * @param fieldName - The field name (used to determine if URL encoding is needed)
 * @param badValues - Array of bad values to check for (optional)
 * @returns The sanitized text
 */
export function sanitizeHtml(text: string | null | undefined, isUrl?: boolean, badValues: string[] = []): string {
   if (isNullOrWhiteSpace(text)) {
      return '';
   }

   let result = text!;

   // URL encoding for URL fields
   if (isUrl) {
      result = encodeURIComponent(result);
   } else {
      // Remove HTML tags
      const test = result.replace(/<[^>]*>/g, '');

      // Check for bad values and HTML encode if found
      for (const item of badValues) {
         if (test.includes(item)) {
            result = escapeHtml(result);
            break;
         }
      }
   }

   // Decode common HTML entities
   result = result
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, '\'');

   // Allow special Spanish characters
   result = result
      .replace(/&iexcl;/g, '¡')
      .replace(/&iquest;/g, '¿')
      .replace(/&Aacute;/g, 'Á')
      .replace(/&Eacute;/g, 'É')
      .replace(/&Iacute;/g, 'Í')
      .replace(/&Ntilde;/g, 'Ñ')
      .replace(/&Oacute;/g, 'Ó')
      .replace(/&Uacute;/g, 'Ú')
      .replace(/&Uuml;/g, 'Ü')
      .replace(/&aacute;/g, 'á')
      .replace(/&eacute;/g, 'é')
      .replace(/&iacute;/g, 'í')
      .replace(/&ntilde;/g, 'ñ')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uuml;/g, 'ú')
      .replace(/&uacute;/g, 'ü');

   // Decode numeric HTML entities
   result = result
      .replace(/&#193;/g, 'Á')
      .replace(/&#225;/g, 'á')
      .replace(/&#201;/g, 'É')
      .replace(/&#233;/g, 'é')
      .replace(/&#205;/g, 'Í')
      .replace(/&#237;/g, 'í')
      .replace(/&#209;/g, 'Ñ')
      .replace(/&#241;/g, 'ñ')
      .replace(/&#211;/g, 'Ó')
      .replace(/&#243;/g, 'ó')
      .replace(/&#218;/g, 'Ú')
      .replace(/&#250;/g, 'ú')
      .replace(/&#220;/g, 'Ü')
      .replace(/&#252;/g, 'ü')
      .replace(/&#191;/g, '¿')
      .replace(/&#161;/g, '¡');

   // Allow apostrophe
   result = result.replace(/&#39;/g, '\'');

   return result;
}

/**
 * Escapes HTML special characters
 * @param text - The text to escape
 * @returns The HTML-escaped text
 */
export function escapeHtml(text: string): string {
   const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;',
   };

   return text.replace(/[&<>"']/g, match => htmlEscapes[match]);
}

/**
 * Gets default bad values for HTML sanitization
 * @returns Array of potentially dangerous strings
 */
export function getDefaultBadValues(): string[] {
   return ['<script', 'javascript:', 'onload=', 'onerror=', 'onclick=', 'onmouseover=', 'eval(', 'document.cookie', 'window.location'];
}

/**
 * Truncates a string from the start while preserving the end portion
 * Equivalent to C#'s TruncateStart extension method
 * @param data - The string to truncate
 * @param maxLength - Maximum length of the result
 * @param prefix - Optional prefix to add to the truncated string
 * @returns The truncated string with prefix, or empty string if input is null/undefined
 */
export function truncateStart(data: string | null | undefined, maxLength: number, prefix: string = ''): string {
   if (isNullOrWhiteSpace(data)) {
      return '';
   }

   const text = data!;

   if (text.length > maxLength) {
      return prefix + text.substring(text.length - maxLength);
   }

   return text;
}

/**
 * Truncates a string from the end while preserving the start portion
 * @param data - The string to truncate
 * @param maxLength - Maximum length of the result
 * @param suffix - Optional suffix to add to the truncated string
 * @returns The truncated string with suffix, or empty string if input is null/undefined
 */
export function truncateEnd(data: string | null | undefined, maxLength: number, suffix: string = ''): string {
   if (isNullOrWhiteSpace(data)) {
      return '';
   }

   const text = data!;

   if (text.length > maxLength) {
      return text.substring(0, maxLength) + suffix;
   }

   return text;
}

/**
 * Truncates a string from the middle, preserving both start and end portions
 * @param data - The string to truncate
 * @param maxLength - Maximum length of the result
 * @param separator - String to use in the middle (default: '...')
 * @returns The truncated string, or empty string if input is null/undefined
 */
export function truncateMiddle(data: string | null | undefined, maxLength: number, separator: string = '...'): string {
   if (isNullOrWhiteSpace(data)) {
      return '';
   }

   const text = data!;

   if (text.length <= maxLength) {
      return text;
   }

   const separatorLength = separator.length;
   const availableLength = maxLength - separatorLength;
   const startLength = Math.ceil(availableLength / 2);
   const endLength = Math.floor(availableLength / 2);

   return text.substring(0, startLength) + separator + text.substring(text.length - endLength);
}

/**
 * Formats a string by replacing placeholders with provided arguments
 * @param text - The template string with placeholders like {0}, {1}, etc.
 * @param args - Array of arguments to replace the placeholders
 * @returns The formatted string with placeholders replaced
 *
 * @example
 * formatString("you must provide a value for {0}", ["first_name"])
 * // Returns: "you must provide a value for first_name"
 *
 * @example
 * formatString("Hello {0}, your age is {1}", ["John", 25])
 * // Returns: "Hello John, your age is 25"
 */
export function formatString(text: string, args: any[]): string {
   if (!args || args.length == 0) {
      return text;
   }
   return text.replace(/\{(\d+)\}/g, (match, index) => {
      const argIndex = parseInt(index, 10);
      return args[argIndex] !== undefined ? String(args[argIndex]) : match;
   });
}

/**
 * Normalizes a single string to hashtag format: lowercase, no spaces, no special
 * characters except word-safe Unicode letters/digits and underscores.
 * Strips a leading '#' if present and collapses consecutive underscores.
 * Returns empty string for blank input.
 */
export function sanitizeHashtag(value: string | null | undefined): string {
   if (isNullOrWhiteSpace(value)) {
      return '';
   }

   let result = value!.trim();

   if (result.startsWith('#')) {
      result = result.substring(1);
   }

   result = result.toLowerCase();
   result = result.replace(/\s+/g, '');
   result = result.replace(/[^\p{L}\p{N}_]/gu, '');
   result = result.replace(/_{2,}/g, '_');
   result = result.replace(/^_+|_+$/g, '');

   return result;
}

/**
 * Sanitizes a single topic string: trims, strips leading '#', collapses
 * internal whitespace runs to a single space, removes characters that are
 * not Unicode letters, digits, underscores, or spaces.
 * Preserves original casing and interior spaces (unlike sanitizeHashtag).
 */
export function sanitizeTopic(value: string | null | undefined): string {
   if (isNullOrWhiteSpace(value)) {
      return '';
   }

   let result = value!.trim();

   if (result.startsWith('#')) {
      result = result.substring(1).trim();
   }

   result = result.replace(/[^\p{L}\p{N}_\s]/gu, '');
   result = result.replace(/\s+/g, ' ');
   result = result.replace(/_{2,}/g, '_');
   result = result.trim();

   return result;
}

/**
 * Sanitizes an array of topic strings. Preserves casing and spaces.
 * De-duplicates by exact match; the UI handles normalized-duplicate detection.
 */
export function sanitizeTopics(topics: string[] | null | undefined, maxTopics: number = 20): string[] {
   if (!topics || topics.length === 0) {
      return [];
   }

   const seen = new Set<string>();
   const result: string[] = [];

   for (const raw of topics) {
      const topic = sanitizeTopic(raw);
      if (topic.length > 0 && !seen.has(topic)) {
         seen.add(topic);
         result.push(topic);
         if (result.length >= maxTopics) {
            break;
         }
      }
   }

   return result;
}

/**
 * Sanitizes a file name by converting to lowercase and removing/replacing unsafe characters
 * @param fileName - The file name to sanitize
 * @returns The sanitized file name with only safe characters
 *
 * @example
 * sanitizeFileName("My File (1).jpg")
 * // Returns: "my_file_1_.jpg"
 *
 * @example
 * sanitizeFileName("Test@#$%File.txt")
 * // Returns: "test_file.txt"
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
   if (isNullOrWhiteSpace(fileName)) {
      return '';
   }

   let sanitized = fileName!.toLowerCase();

   // Replace spaces with underscores
   sanitized = sanitized.replace(/\s+/g, '_');

   // Remove or replace unsafe characters, keeping only alphanumeric, dots, hyphens, and underscores
   sanitized = sanitized.replace(/[^a-z0-9._-]/g, '');

   // Remove multiple consecutive dots, underscores, or hyphens
   sanitized = sanitized.replace(/\.{2,}/g, '.');
   sanitized = sanitized.replace(/_{2,}/g, '_');
   sanitized = sanitized.replace(/-{2,}/g, '-');

   // Remove leading/trailing dots, underscores, or hyphens
   sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, '');

   // Ensure the file has a reasonable length (max 255 characters)
   if (sanitized.length > 255) {
      const lastDotIndex = sanitized.lastIndexOf('.');
      if (lastDotIndex > 0) {
         const name = sanitized.substring(0, lastDotIndex);
         const extension = sanitized.substring(lastDotIndex);
         sanitized = name.substring(0, 255 - extension.length) + extension;
      } else {
         sanitized = sanitized.substring(0, 255);
      }
   }

   return sanitized;
}
