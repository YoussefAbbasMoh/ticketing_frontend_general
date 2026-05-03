import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getStoredLanguage, setStoredLanguage } from '../i18n';
import {
  landingCopy,
  normalizeLandingLang,
  type LandingLang,
  type LandingMessages,
} from '@/landing/lib/landingCopy';

type LandingLangContextValue = {
  lang: LandingLang;
  setLang: (next: LandingLang) => void;
  copy: LandingMessages;
};

const LandingLangContext = createContext<LandingLangContextValue | null>(null);

export function LandingLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LandingLang>(() =>
    normalizeLandingLang(getStoredLanguage())
  );

  useEffect(() => {
    const sync = () => setLangState(normalizeLandingLang(getStoredLanguage()));
    window.addEventListener('language-changed', sync);
    return () => window.removeEventListener('language-changed', sync);
  }, []);

  const setLang = useCallback((next: LandingLang) => {
    setStoredLanguage(next);
    setLangState(next);
  }, []);

  const copy = useMemo(() => landingCopy[lang], [lang]);

  const value = useMemo(
    () => ({ lang, setLang, copy }),
    [lang, setLang, copy]
  );

  return (
    <LandingLangContext.Provider value={value}>{children}</LandingLangContext.Provider>
  );
}

export function useLandingLang(): LandingLangContextValue {
  const ctx = useContext(LandingLangContext);
  if (!ctx) {
    throw new Error('useLandingLang must be used within LandingLangProvider');
  }
  return ctx;
}
