import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languages } from './languages';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import ber from './locales/ber.json';
import es from './locales/es.json';
import de from './locales/de.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
  ber: { translation: ber },
  es: { translation: es },
  de: { translation: de }
};

// Add other languages with English as fallback
const otherLangs = ['it', 'pt', 'ru', 'zh', 'ja', 'ko', 'hi', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'el', 'he', 'th', 'vi', 'id'];
otherLangs.forEach(lang => {
  resources[lang] = { translation: en };
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;