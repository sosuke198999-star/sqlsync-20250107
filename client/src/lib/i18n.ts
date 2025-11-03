import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal, valid i18n setup used during CI/debug. Replace with
// a proper locale-loading strategy (e.g. JSON files) when ready.
const resources = {
  ja: { translation: { 'common.view': '詳細' } },
  en: { translation: { 'common.view': 'View' } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: typeof window !== 'undefined' ? localStorage.getItem('language') || 'ja' : 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

export default i18n;
