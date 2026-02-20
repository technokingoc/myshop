import { createTranslator } from 'next-intl';
import enMessages from '../../messages/en.json';
import ptMessages from '../../messages/pt.json';

export type AppLang = 'en' | 'pt';

// Messages type from the JSON structure
type Messages = typeof enMessages;

// Create the dictionary from the JSON files
export const dictionary = {
  en: enMessages,
  pt: ptMessages,
} as const;

// Legacy export for backward compatibility
export type AppDictionary = Messages;

/**
 * Get dictionary for a specific language (legacy compatibility)
 */
export function getDict(lang: AppLang): AppDictionary {
  return dictionary[lang];
}

/**
 * Create a translator function for a specific language
 * This provides type-safe translations with next-intl patterns
 */
export function createDictionary(lang: AppLang) {
  const messages = dictionary[lang];
  
  // Create next-intl compatible translator
  const t = createTranslator({ 
    locale: lang, 
    messages,
    // Handle missing translations gracefully
    onError: (error) => {
      console.warn('Translation error:', error);
    }
  });

  return t;
}

/**
 * Get nested translation key with fallback
 */
export function getNestedTranslation(
  dict: AppDictionary, 
  key: string, 
  fallback?: string
): string {
  const keys = key.split('.');
  let result: any = dict;
  
  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) break;
  }
  
  return typeof result === 'string' ? result : (fallback || key);
}

/**
 * Simple interpolation for dynamic values
 * Example: interpolate("Hello {name}", { name: "John" }) -> "Hello John"
 */
export function interpolate(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() || match;
  });
}

/**
 * Language configuration for the application
 */
export const languageConfig = {
  locales: ['en', 'pt'] as const,
  defaultLocale: 'en' as const,
  labels: {
    en: 'English',
    pt: 'Português',
  },
  directions: {
    en: 'ltr' as const,
    pt: 'ltr' as const,
  },
  // Future RTL support preparation
  rtlLocales: [] as readonly AppLang[],
};

/**
 * Check if a locale is RTL
 */
export function isRtl(locale: AppLang): boolean {
  return languageConfig.rtlLocales.includes(locale);
}

/**
 * Get text direction for a locale
 */
export function getTextDirection(locale: AppLang): 'ltr' | 'rtl' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, locale: AppLang, options?: Intl.DateTimeFormatOptions): string {
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : 'en-US', formatOptions).format(date);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number, 
  locale: AppLang, 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-PT' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Validate if a locale is supported
 */
export function isValidLocale(locale: string): locale is AppLang {
  return languageConfig.locales.includes(locale as AppLang);
}

/**
 * Get the best matching locale from a list of preferred locales
 */
export function getBestMatchingLocale(
  preferredLocales: readonly string[], 
  fallback: AppLang = 'en'
): AppLang {
  for (const preferred of preferredLocales) {
    // Direct match
    if (isValidLocale(preferred)) {
      return preferred;
    }
    
    // Language code match (e.g., 'pt-BR' -> 'pt')
    const languageCode = preferred.split('-')[0];
    if (isValidLocale(languageCode)) {
      return languageCode;
    }
  }
  
  return fallback;
}