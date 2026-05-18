import { useCallback, useRef, useState } from 'react';
import { completionGifAPI } from '../services/api';
import TaskCompletionCelebration from '../components/personal-tasks/TaskCompletionCelebration';
import {
  getLastCompletionGifId,
  pickRandomCompletionGif,
  setLastCompletionGifId,
} from '../utils/completionGifPicker';

/**
 * Fetch a random completion GIF and show celebration overlay.
 * @param {string} lang
 */
export function useTaskCompletionCelebration(lang) {
  const [gif, setGif] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const gifsCacheRef = useRef(null);
  const failedIdsRef = useRef(new Set());

  const loadGifCatalog = useCallback(async () => {
    const res = await completionGifAPI.list();
    const gifs = Array.isArray(res?.data?.gifs) ? res.data.gifs : [];
    gifsCacheRef.current = gifs;
    return gifs;
  }, []);

  const pickNext = useCallback(async (extraExcludeIds = null) => {
    const excludeLast = getLastCompletionGifId();
    const alsoExclude = new Set(failedIdsRef.current);
    if (extraExcludeIds) {
      for (const id of extraExcludeIds) alsoExclude.add(String(id));
    }

    let gifs = gifsCacheRef.current;
    if (!gifs?.length) {
      gifs = await loadGifCatalog();
    }
    if (!gifs.length) return null;

    let picked = pickRandomCompletionGif(gifs, excludeLast, alsoExclude);
    if (!picked) {
      try {
        const res = await completionGifAPI.getRandom(excludeLast);
        picked = res?.data?.gif;
      } catch {
        /* older API */
      }
    }
    return picked?.url ? picked : null;
  }, [loadGifCatalog]);

  const showPicked = useCallback((picked, title) => {
    if (!picked?.url) return false;
    setLastCompletionGifId(picked.id);
    setTaskTitle(typeof title === 'string' ? title : '');
    setGif(picked);
    return true;
  }, []);

  const dismiss = useCallback(() => {
    setGif(null);
    setTaskTitle('');
  }, []);

  const celebrate = useCallback(
    async (title = '') => {
      try {
        failedIdsRef.current = new Set();
        const picked = await pickNext();
        return showPicked(picked, title);
      } catch {
        return false;
      }
    },
    [pickNext, showPicked]
  );

  const handleGifError = useCallback(
    async (brokenId) => {
      if (brokenId) failedIdsRef.current.add(String(brokenId));
      let gifs = gifsCacheRef.current;
      if (!gifs?.length) gifs = await loadGifCatalog();
      const available = (gifs || []).filter(
        (g) => g?.url && !failedIdsRef.current.has(String(g.id))
      );
      if (!available.length) return;
      const picked = pickRandomCompletionGif(available, getLastCompletionGifId(), failedIdsRef.current);
      if (picked) showPicked(picked, taskTitle);
    },
    [loadGifCatalog, showPicked, taskTitle]
  );

  const overlay =
    gif != null ? (
      <TaskCompletionCelebration
        gif={gif}
        taskTitle={taskTitle}
        lang={lang}
        onDismiss={dismiss}
        onGifError={handleGifError}
      />
    ) : null;

  return { celebrate, dismiss, overlay, active: gif != null, gif, taskTitle, handleGifError };
}
