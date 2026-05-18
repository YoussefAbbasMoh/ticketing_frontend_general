/** At least two name parts; each part at least two characters (letters or numbers). */
export const isValidPersonFullName = (value) => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((part) => part.length >= 2);
};
