
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction, useCallback } from 'react';

type Translations = { [key: string]: string | Translations };

interface LanguageContextType {
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  translations: Translations;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translate = (translations: Translations, key: string): string => {
    if (!key || typeof key !== 'string') return '';
    const keys = key.split('.');
    let result: string | Translations | undefined = translations;
    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return key; 
        }
    }
    return typeof result === 'string' ? result : key;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Auto-detect browser language
    if (typeof window !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0]; // e.g., 'en' from 'en-US'
      setLanguage(browserLang);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
            console.warn(`Could not load translations for ${language}. Falling back to English.`);
            if(language !== 'en') {
                const fallbackResponse = await fetch(`/locales/en.json`);
                const data = await fallbackResponse.json();
                setTranslations(data);
            }
            return;
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error('Failed to fetch translations:', error);
      }
    };

    fetchTranslations();
  }, [language, isClient]);

  const t = useCallback((key: string) => {
    return translate(translations, key);
  }, [translations]);

  const value = { language, setLanguage, translations, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
    const { t } = useLanguage();
    return { t };
}
