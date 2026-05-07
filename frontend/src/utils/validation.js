/**
 * Ethiopian phone number validation
 *
 * Valid formats:
 *   +251 9x xxxxxxx  (mobile: +2519xxxxxxxx)
 *   +251 7x xxxxxxx  (mobile: +2517xxxxxxxx)
 *   09xxxxxxxx       (local format, 10 digits)
 *   07xxxxxxxx       (local format, 10 digits)
 *
 * Rules:
 *   - After +251 or 0, next digit must be 9 or 7
 *   - Total digits (excluding +) must be 12 for international, 10 for local
 */
export function validateEthiopianPhone(phone) {
  if (!phone) return { valid: true, message: '' }; // optional field

  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');

  // International format: +2519xxxxxxxx or +2517xxxxxxxx (13 chars total)
  const intlPattern = /^\+251[79]\d{8}$/;
  // Local format: 09xxxxxxxx or 07xxxxxxxx (10 digits)
  const localPattern = /^0[79]\d{8}$/;

  if (intlPattern.test(cleaned) || localPattern.test(cleaned)) {
    return { valid: true, message: '' };
  }

  return {
    valid: false,
    message: 'Enter a valid Ethiopian phone number (e.g. 0912345678 or +251912345678)',
  };
}

/**
 * Normalize phone to +251 format for storage
 */
export function normalizePhone(phone) {
  if (!phone) return phone;
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('0')) return '+251' + cleaned.slice(1);
  return cleaned;
}
