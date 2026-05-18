const LAST_GIF_STORAGE_KEY = 'personalTaskLastCompletionGifId';

export const getLastCompletionGifId = () => {
  try {
    return sessionStorage.getItem(LAST_GIF_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

export const setLastCompletionGifId = (id) => {
  if (id == null) return;
  try {
    sessionStorage.setItem(LAST_GIF_STORAGE_KEY, String(id));
  } catch {
    /* ignore */
  }
};

/**
 * Pick a random GIF, avoiding the last one shown (and optional extra excludes).
 * @param {Array<{ id: string, url: string, label?: string | null }>} gifs
 * @param {string | null} excludeId
 * @param {Set<string>} [alsoExclude]
 */
export const pickRandomCompletionGif = (gifs, excludeId = null, alsoExclude = null) => {
  if (!Array.isArray(gifs) || !gifs.length) return null;

  const blocked = new Set();
  if (excludeId) blocked.add(String(excludeId));
  if (alsoExclude) {
    for (const id of alsoExclude) blocked.add(String(id));
  }

  let pool = gifs.filter((g) => g?.url && !blocked.has(String(g.id)));
  if (!pool.length) pool = gifs.filter((g) => g?.url);
  if (!pool.length) return null;

  const idx = Math.floor(Math.random() * pool.length);
  const g = pool[idx];
  return { id: g.id, url: g.url, label: g.label ?? null };
};
