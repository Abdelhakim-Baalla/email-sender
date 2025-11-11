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
  de: { translation: de },
  it: { translation: en },
  pt: { translation: en },
  ru: { translation: en },
  zh: { translation: en },
  ja: { translation: en },
  ko: { translation: en },
  hi: { translation: en },
  tr: { translation: en },
  nl: { translation: en },
  pl: { translation: en },
  sv: { translation: en },
  no: { translation: en },
  da: { translation: en },
  fi: { translation: en },
  el: { translation: en },
  he: { translation: en },
  th: { translation: en },
  vi: { translation: en },
  id: { translation: en }
};

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