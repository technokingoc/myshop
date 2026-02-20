"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { AppLang, languageConfig, getBestMatchingLocale, isValidLocale } from "./i18n";

const LANG_STORAGE_KEY = "myshop_lang";
const USER_LANG_STORAGE_KEY = "myshop_user_lang";

type LanguageContextValue = {
  /** Current active language */
  lang: AppLang;
  /** Set the language (persists to localStorage) */
  setLang: (lang: AppLang) => void;
  /** User's preferred language (null = use store default) */
  userPreference: AppLang | null;
  /** Set user language preference */
  setUserPreference: (lang: AppLang | null) => void;
  /** Store's default language */
  storeLanguage: AppLang;
  /** Set store default language */
  setStoreLanguage: (lang: AppLang) => void;
  /** Available languages */
  availableLanguages: readonly AppLang[];
  /** Get language label */
  getLanguageLabel: (lang: AppLang) => string;
  /** Check if language is RTL */
  isRtl: boolean;
  /** Text direction */
  textDirection: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
  /** Initial store language (from database) */
  initialStoreLanguage?: AppLang;
  /** Initial user preference (from user profile) */
  initialUserPreference?: AppLang | null;
  /** Callback when store language changes */
  onStoreLanguageChange?: (lang: AppLang) => void;
  /** Callback when user preference changes */
  onUserPreferenceChange?: (lang: AppLang | null) => void;
}

export function LanguageProvider({
  children,
  initialStoreLanguage = 'en',
  initialUserPreference = null,
  onStoreLanguageChange,
  onUserPreferenceChange,
}: LanguageProviderProps) {
  // Store language setting
  const [storeLanguage, setStoreLanguageState] = useState<AppLang>(initialStoreLanguage);
  
  // User's language preference (null = use store default)
  const [userPreference, setUserPreferenceState] = useState<AppLang | null>(() => {
    if (typeof window === "undefined") return initialUserPreference;
    
    const stored = localStorage.getItem(USER_LANG_STORAGE_KEY);
    if (stored && isValidLocale(stored)) {
      return stored;
    }
    
    return initialUserPreference;
  });

  // Active language: user preference > store language > browser locale > fallback
  const [activeLang, setActiveLang] = useState<AppLang>(() => {
    if (typeof window === "undefined") {
      return userPreference || storeLanguage;
    }

    // Check localStorage for explicit language choice
    const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (storedLang && isValidLocale(storedLang)) {
      return storedLang;
    }

    // Use user preference if set
    if (userPreference) {
      return userPreference;
    }

    // Use store language
    if (storeLanguage) {
      return storeLanguage;
    }

    // Detect from browser
    const browserLanguages = navigator.languages || [navigator.language];
    return getBestMatchingLocale(browserLanguages, 'en');
  });

  // Update store language
  const setStoreLanguage = useCallback((lang: AppLang) => {
    setStoreLanguageState(lang);
    onStoreLanguageChange?.(lang);
    
    // If user has no preference, update active language
    if (!userPreference) {
      setActiveLang(lang);
    }
  }, [userPreference, onStoreLanguageChange]);

  // Update user preference
  const setUserPreference = useCallback((lang: AppLang | null) => {
    setUserPreferenceState(lang);
    
    // Persist to localStorage
    if (typeof window !== "undefined") {
      if (lang) {
        localStorage.setItem(USER_LANG_STORAGE_KEY, lang);
      } else {
        localStorage.removeItem(USER_LANG_STORAGE_KEY);
      }
    }
    
    // Update active language
    setActiveLang(lang || storeLanguage);
    
    onUserPreferenceChange?.(lang);
  }, [storeLanguage, onUserPreferenceChange]);

  // Set language (legacy compatibility)
  const setLang = useCallback((lang: AppLang) => {
    setActiveLang(lang);
    
    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
    
    // This is treated as a user preference
    setUserPreference(lang);
  }, [setUserPreference]);

  // Get language label
  const getLanguageLabel = useCallback((lang: AppLang): string => {
    return languageConfig.labels[lang] || lang;
  }, []);

  // RTL support
  const isRtl = languageConfig.rtlLocales.includes(activeLang);
  const textDirection = isRtl ? 'rtl' : 'ltr';

  // Update document attributes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    document.documentElement.lang = activeLang;
    document.documentElement.dir = textDirection;
    
    // Update localStorage
    localStorage.setItem(LANG_STORAGE_KEY, activeLang);
  }, [activeLang, textDirection]);

  const value = useMemo(() => ({
    lang: activeLang,
    setLang,
    userPreference,
    setUserPreference,
    storeLanguage,
    setStoreLanguage,
    availableLanguages: languageConfig.locales,
    getLanguageLabel,
    isRtl,
    textDirection,
  }), [
    activeLang,
    setLang,
    userPreference,
    setUserPreference,
    storeLanguage,
    setStoreLanguage,
    getLanguageLabel,
    isRtl,
    textDirection,
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

/**
 * Hook to get translations for current language
 */
export function useTranslations() {
  const { lang } = useLanguage();
  
  // Import dynamically to avoid bundling all translations
  const [messages, setMessages] = useState<any>(null);
  
  useEffect(() => {
    const loadMessages = async () => {
      if (lang === 'en') {
        const { default: enMessages } = await import('../../messages/en.json');
        setMessages(enMessages);
      } else if (lang === 'pt') {
        const { default: ptMessages } = await import('../../messages/pt.json');
        setMessages(ptMessages);
      }
    };
    
    loadMessages();
  }, [lang]);

  return { t: messages, lang, loading: !messages };
}

/**
 * Higher-order component to inject language context
 */
export function withLanguage<T extends object>(Component: React.ComponentType<T>) {
  return function LanguageInjectedComponent(props: T) {
    const languageContext = useLanguage();
    return <Component {...props} {...languageContext} />;
  };
}

export const languageStorageKey = LANG_STORAGE_KEY;
export const userLanguageStorageKey = USER_LANG_STORAGE_KEY;