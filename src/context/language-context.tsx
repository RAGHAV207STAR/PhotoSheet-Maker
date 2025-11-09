
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode, type Dispatch, type SetStateAction, useCallback } from 'react';

// Define a type for your translation keys and values
type Translations = { [key: string]: string | Translations };

interface LanguageContextType {
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  translations: Translations;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// A simple translation function that handles nested keys
const translate = (translations: Translations, key: string): string => {
    const keys = key.split('.');
    let result: string | Translations | undefined = translations;
    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return key; // Return the key itself if translation is not found
        }
    }
    return typeof result === 'string' ? result : key;
};


export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    const savedLanguage = localStorage.getItem('app-language') || 'en';
    setLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
            console.warn(`Could not load translations for ${language}. Falling back to English.`);
            const fallbackResponse = await fetch(`/locales/en.json`);
            const data = await fallbackResponse.json();
            setTranslations(data);
            return;
        }
        const data = await response.json();
        setTranslations(data);
        localStorage.setItem('app-language', language);
      } catch (error) {
        console.error('Failed to fetch translations:', error);
      }
    };

    fetchTranslations();
  }, [language]);

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
