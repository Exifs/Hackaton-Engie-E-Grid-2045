import i18next, { type InitOptions, type TOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import fr from "./locales/fr";

export const supportedLngs = ["en", "fr"] as const;
export type SupportedLanguage = typeof supportedLngs[number];

export const fallbackLng: SupportedLanguage = "en";

export const resources = {
  en: { translation: en },
  fr: { translation: fr }
} as const;

export const defaultI18nOptions: InitOptions = {
  resources,
  supportedLngs: [...supportedLngs],
  fallbackLng,
  interpolation: {
    escapeValue: false
  },
  detection: {
    order: ["querystring", "navigator"],
    lookupQuerystring: "lng",
    caches: []
  }
};

export async function initI18n(options: InitOptions = {}): Promise<typeof i18next> {
  if (!i18next.isInitialized) {
    i18next.use(LanguageDetector);
  }

  await i18next.init({
    ...defaultI18nOptions,
    ...options
  });

  document.documentElement.lang = i18next.resolvedLanguage ?? fallbackLng;
  return i18next;
}

export async function createTestI18n(lng: string): Promise<typeof i18next> {
  const instance = i18next.createInstance();
  await instance.init({
    ...defaultI18nOptions,
    lng
  });
  return instance;
}

export function t(key: string, options?: TOptions): string {
  if (i18next.isInitialized) {
    return i18next.t(key, options);
  }
  const fallback = lookupDefaultTranslation(key);
  if (fallback !== undefined) {
    return interpolate(fallback, options);
  }
  return key;
}

export { i18next };

function lookupDefaultTranslation(key: string): string | undefined {
  let value: unknown = resources[fallbackLng].translation;
  for (const segment of key.split(".")) {
    if (!value || typeof value !== "object" || !(segment in value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[segment];
  }
  return typeof value === "string" ? value : undefined;
}

function interpolate(value: string, options?: TOptions): string {
  if (!options) {
    return value;
  }
  return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const replacement = (options as Record<string, unknown>)[key];
    return replacement === undefined ? match : String(replacement);
  });
}
