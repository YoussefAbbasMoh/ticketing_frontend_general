/**
 * Same rules as backend `utils/checkoutNote.js` — keep in sync when changing validation.
 */
const normalizeForLetterCount = (s) =>
  String(s || '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim();

export const isSubstantiveCheckoutNote = (raw) => {
  const trimmed = String(raw || '').trim();
  if (trimmed.length < 8) return false;
  if (normalizeForLetterCount(trimmed).length < 5) return false;
  return true;
};

export const checkoutNoteValidationMessage = (raw) => {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'empty';
  if (!isSubstantiveCheckoutNote(trimmed)) return 'weak';
  return null;
};
