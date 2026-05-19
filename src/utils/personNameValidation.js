const MIN_NAME_WORDS = 2;
const MIN_NAME_WORD_LEN = 2;
const LETTER_PART_RE = /^[\p{L}]{2,}$/u;

export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const personNameParts = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export const hasNonLetterCharsInPersonName = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  return /[^\p{L}\s]/u.test(trimmed);
};

/** At least two words; each word at least two Unicode letters (no digits or symbols). */
export const isValidPersonFullName = (value) => {
  const parts = personNameParts(value);
  if (parts.length < MIN_NAME_WORDS) return false;
  return parts.every((part) => LETTER_PART_RE.test(part));
};

export const getPersonNameFieldError = (value, t) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return t('valOwnerNameRequired');
  if (hasNonLetterCharsInPersonName(trimmed)) return t('valOwnerNameLettersOnly');
  if (!isValidPersonFullName(trimmed)) return t('valOwnerNameFullName');
  return '';
};

export const isStrongPassword = (password) => STRONG_PASSWORD_REGEX.test(String(password || ''));
