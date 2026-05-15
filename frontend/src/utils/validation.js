/**
 * EEU Service System — Input Validation Utilities
 */

// ── Name validation ──────────────────────────────────────────
// Only letters (including Ethiopian characters), spaces, hyphens, apostrophes
export function validateName(name) {
  if (!name || !name.trim()) return { valid: false, message: 'Name is required' };
  if (name.trim().length < 2) return { valid: false, message: 'Name must be at least 2 characters' };
  // Allow Latin letters, Ethiopian (Amharic/Oromo) Unicode, spaces, hyphens, apostrophes
  const namePattern = /^[\p{L}\s'-]+$/u;
  if (!namePattern.test(name.trim())) {
    return { valid: false, message: 'Name must contain only letters (no numbers or special characters)' };
  }
  return { valid: true, message: '' };
}

// ── Password strength ────────────────────────────────────────
// Min 8 chars, 1 uppercase, 1 number, 1 special character
export function validatePassword(password) {
  if (!password) return { valid: false, message: 'Password is required', strength: 0 };

  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /\d/.test(password),
    special:   /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const strength = passed; // 0–4

  if (!checks.length)    return { valid: false, message: 'Password must be at least 8 characters', strength, checks };
  if (!checks.uppercase) return { valid: false, message: 'Add at least one uppercase letter (A–Z)', strength, checks };
  if (!checks.number)    return { valid: false, message: 'Add at least one number (0–9)', strength, checks };
  if (!checks.special)   return { valid: false, message: 'Add at least one special character (!@#$...)', strength, checks };

  return { valid: true, message: '', strength: 4, checks };
}

// Strength label and color
export function passwordStrengthInfo(strength) {
  if (strength <= 1) return { label: 'Weak',   color: '#c62828' };
  if (strength === 2) return { label: 'Fair',   color: '#e65100' };
  if (strength === 3) return { label: 'Good',   color: '#F5A623' };
  return               { label: 'Strong', color: '#2e7d32' };
}

// ── Ethiopian phone validation ───────────────────────────────
export function validateEthiopianPhone(phone) {
  if (!phone) return { valid: true, message: '' };
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  const intlPattern = /^\+251[79]\d{8}$/;
  const localPattern = /^0[79]\d{8}$/;
  if (intlPattern.test(cleaned) || localPattern.test(cleaned)) return { valid: true, message: '' };
  return { valid: false, message: 'Enter a valid Ethiopian phone number (e.g. 0912345678 or +251912345678)' };
}

export function normalizePhone(phone) {
  if (!phone) return phone;
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('0')) return '+251' + cleaned.slice(1);
  return cleaned;
}
