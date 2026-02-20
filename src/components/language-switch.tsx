"use client";

import { useLanguage } from "@/lib/language";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface LanguageSwitchProps {
  /** Show language preference info */
  showPreferenceInfo?: boolean;
  /** Show as dropdown instead of toggle buttons */
  variant?: 'toggle' | 'dropdown';
  /** Size of the component */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class names */
  className?: string;
}

export function LanguageSwitch({ 
  showPreferenceInfo = false, 
  variant = 'toggle',
  size = 'md',
  className = ""
}: LanguageSwitchProps) {
  const { 
    lang, 
    setLang, 
    userPreference, 
    storeLanguage, 
    availableLanguages, 
    getLanguageLabel 
  } = useLanguage();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Size classes
  const sizeClasses = {
    sm: {
      button: "px-2 py-1 text-xs",
      container: "text-xs",
      dropdown: "text-sm",
    },
    md: {
      button: "px-3 py-1.5 text-sm",
      container: "text-sm",
      dropdown: "text-sm",
    },
    lg: {
      button: "px-4 py-2 text-base",
      container: "text-base", 
      dropdown: "text-base",
    },
  };

  const currentSize = sizeClasses[size];

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            inline-flex items-center gap-2 rounded-lg border border-slate-200/90 
            bg-white/90 shadow-sm backdrop-blur transition-colors
            hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/20
            ${currentSize.button}
          `}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <span className="font-semibold">{getLanguageLabel(lang).toUpperCase()}</span>
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isDropdownOpen && (
          <div className={`
            absolute right-0 top-full mt-1 min-w-[200px] rounded-lg border border-slate-200 
            bg-white shadow-lg z-50 ${currentSize.dropdown}
          `}>
            <div className="p-2">
              {showPreferenceInfo && (
                <div className="px-3 py-2 text-xs text-slate-600 border-b border-slate-100 mb-2">
                  {userPreference 
                    ? "Your preference overrides store settings"
                    : `Using store default (${getLanguageLabel(storeLanguage)})`
                  }
                </div>
              )}
              
              {availableLanguages.map((langOption) => (
                <button
                  key={langOption}
                  onClick={() => {
                    setLang(langOption);
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2 rounded-md transition-colors
                    ${lang === langOption 
                      ? 'bg-green-100 text-green-900 font-medium' 
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                  aria-pressed={lang === langOption}
                >
                  <div className="flex items-center justify-between">
                    <span>{getLanguageLabel(langOption)}</span>
                    {lang === langOption && (
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Toggle variant (default)
  return (
    <div className={`${className}`}>
      <div className="inline-flex rounded-full border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur">
        {availableLanguages.map((langOption) => (
          <button
            key={langOption}
            onClick={() => setLang(langOption)}
            className={`
              rounded-full font-semibold transition
              ${currentSize.button}
              ${lang === langOption
                ? "bg-green-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-green-50 hover:text-slate-900"
              }
            `}
            aria-pressed={lang === langOption}
            title={getLanguageLabel(langOption)}
          >
            {langOption.toUpperCase()}
          </button>
        ))}
      </div>
      
      {showPreferenceInfo && (
        <div className={`mt-1 ${currentSize.container} text-slate-500`}>
          {userPreference 
            ? `Your preference: ${getLanguageLabel(userPreference)}`
            : `Store default: ${getLanguageLabel(storeLanguage)}`
          }
        </div>
      )}
    </div>
  );
}

/**
 * Simple language indicator that shows current language without switching capability
 */
export function LanguageIndicator({ className = "" }: { className?: string }) {
  const { lang, getLanguageLabel } = useLanguage();
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600
      ${className}
    `}>
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      {getLanguageLabel(lang)}
    </span>
  );
}

/**
 * Language preference control for user settings
 */
export function LanguagePreference({ className = "" }: { className?: string }) {
  const { 
    userPreference, 
    setUserPreference, 
    storeLanguage, 
    availableLanguages, 
    getLanguageLabel 
  } = useLanguage();

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-sm font-medium text-slate-900 mb-1">Language Preference</h3>
        <p className="text-xs text-slate-600">
          Choose your preferred language. This will override store settings.
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="languagePreference"
            checked={userPreference === null}
            onChange={() => setUserPreference(null)}
            className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
          />
          <span className="text-sm text-slate-700">
            Use store default ({getLanguageLabel(storeLanguage)})
          </span>
        </label>
        
        {availableLanguages.map((langOption) => (
          <label key={langOption} className="flex items-center gap-2">
            <input
              type="radio"
              name="languagePreference"
              checked={userPreference === langOption}
              onChange={() => setUserPreference(langOption)}
              className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
            />
            <span className="text-sm text-slate-700">
              {getLanguageLabel(langOption)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Store language setting control for store settings
 */
export function StoreLanguageSetting({ className = "" }: { className?: string }) {
  const { 
    storeLanguage, 
    setStoreLanguage, 
    availableLanguages, 
    getLanguageLabel 
  } = useLanguage();

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-sm font-medium text-slate-900 mb-1">Store Language</h3>
        <p className="text-xs text-slate-600">
          Default language for your store. Customers can override this with their preference.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {availableLanguages.map((langOption) => (
          <label key={langOption} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="storeLanguage"
              checked={storeLanguage === langOption}
              onChange={() => setStoreLanguage(langOption)}
              className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
            />
            <span className="text-sm text-slate-700 font-medium">
              {getLanguageLabel(langOption)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}