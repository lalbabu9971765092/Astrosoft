// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'hi'],
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    ns: ['translation'],
    defaultNS: 'translation',

    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // ---> Suggested Addition <---
    // Ensures resources are reloaded on language change
    reloadOnLanguageChange: true,

    react: {
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false, // React already safes from xss
    }
  });

export default i18n;
