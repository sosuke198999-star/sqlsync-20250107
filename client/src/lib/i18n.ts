import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// NOTE: Temporarily simplified to avoid huge inline translation object
// which caused a parse error during the Docker build. Replace with
// the full translations later (or load from JSON files).
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
