import { useEffect, useState } from 'react';
import { getStoredLanguage } from '../i18n';

/** True when UI language is Arabic (matches `document.documentElement.dir`). */
export function useIsRtl() {
  const [isRtl, setIsRtl] = useState(() =>
    String(getStoredLanguage() || 'en').toLowerCase().startsWith('ar')
  );

  useEffect(() => {
    const sync = () =>
      setIsRtl(String(getStoredLanguage() || 'en').toLowerCase().startsWith('ar'));
    window.addEventListener('language-changed', sync);
    return () => window.removeEventListener('language-changed', sync);
  }, []);

  return isRtl;
}
