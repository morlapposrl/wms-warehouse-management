import { browser } from '$app/environment';
import { init, register, _, locale as currentLocale, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';

// Import sincroni delle traduzioni per evitare problemi di idratazione
import itTranslations from '../translations/it.json';
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';
import deTranslations from '../translations/de.json';
import esTranslations from '../translations/es.json';
import zhTranslations from '../translations/zh.json';

// Registrare tutte le lingue con import sincroni
register('it', () => Promise.resolve(itTranslations));
register('en', () => Promise.resolve(enTranslations));
register('fr', () => Promise.resolve(frTranslations));
register('de', () => Promise.resolve(deTranslations));
register('es', () => Promise.resolve(esTranslations));
register('zh', () => Promise.resolve(zhTranslations));

let initialized = false;

// Funzione di inizializzazione asincrona
export async function initializeI18n(): Promise<void> {
  if (initialized) return;

  let initialLocale = 'it'; // Default

  if (browser) {
    // Recupera dalla localStorage o browser
    const savedLocale = localStorage.getItem('language');
    if (savedLocale && ['it', 'en', 'fr', 'de', 'es', 'zh'].includes(savedLocale)) {
      initialLocale = savedLocale;
    } else {
      // Prova a rilevare automaticamente dal browser
      const detectedLocale = getLocaleFromNavigator();
      if (detectedLocale) {
        const langCode = detectedLocale.split('-')[0];
        if (['it', 'en', 'fr', 'de', 'es', 'zh'].includes(langCode)) {
          initialLocale = langCode;
        }
      }
    }
  }

  // Inizializza e aspetta che sia pronto
  init({
    fallbackLocale: 'it',
    initialLocale
  });
  
  // Aspetta che la locale sia caricata
  await waitLocale(initialLocale);
  initialized = true;
}

// Funzione per cambiare lingua
export function setLanguage(lang: string) {
  if (['it', 'en', 'fr', 'de', 'es', 'zh'].includes(lang)) {
    currentLocale.set(lang);
    if (browser) {
      localStorage.setItem('language', lang);
    }
  }
}

// Esporta il translator reattivo e locale per uso nei componenti
export { _ as t, currentLocale as locale };

// Lista delle lingue supportate
export const supportedLanguages = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];