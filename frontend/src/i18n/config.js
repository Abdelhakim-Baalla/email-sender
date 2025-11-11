import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { languages } from './languages';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import ber from './locales/ber.json';
import es from './locales/es.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import hi from './locales/hi.json';
import tr from './locales/tr.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import el from './locales/el.json';
import he from './locales/he.json';
import th from './locales/th.json';
import vi from './locales/vi.json';
import id from './locales/id.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
  ber: { translation: ber },
  es: { translation: es },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  hi: { translation: hi },
  tr: { translation: tr },
  nl: { translation: nl },
  pl: { translation: pl },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  el: { translation: el },
  he: { translation: he },
  th: { translation: th },
  vi: { translation: vi },
  id: { translation: id }
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