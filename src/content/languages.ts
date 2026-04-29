// The 20 languages supported by the API. Clients pick one via ?lang=<code>;
// the shared content library and the per-wallet dedup state are keyed per
// (format, language) so dedup does not cross languages.
//
// `name` is the English language name — injected into LLM prompts so every
// provider can resolve the target language without needing its own per-locale
// mapping. `label` is the endonym for display.

export type LangCode =
  | "fr" | "en" | "es" | "de" | "it" | "pt" | "nl" | "pl"
  | "ja" | "zh" | "ko" | "ar" | "he" | "ru" | "tr" | "hi"
  | "sv" | "uk" | "vi" | "id";

export type LangSpec = {
  code: LangCode;
  name: string;   // English name, used in LLM prompts ("French", "Japanese", …)
  label: string;  // Endonym / native label ("Français", "日本語", …)
};

export const LANGUAGES: readonly LangSpec[] = Object.freeze([
  { code: "fr", name: "French",     label: "Français" },
  { code: "en", name: "English",    label: "English" },
  { code: "es", name: "Spanish",    label: "Español" },
  { code: "de", name: "German",     label: "Deutsch" },
  { code: "it", name: "Italian",    label: "Italiano" },
  { code: "pt", name: "Portuguese", label: "Português" },
  { code: "nl", name: "Dutch",      label: "Nederlands" },
  { code: "pl", name: "Polish",     label: "Polski" },
  { code: "ja", name: "Japanese",   label: "日本語" },
  { code: "zh", name: "Chinese",    label: "中文" },
  { code: "ko", name: "Korean",     label: "한국어" },
  { code: "ar", name: "Arabic",     label: "العربية" },
  { code: "he", name: "Hebrew",     label: "עברית" },
  { code: "ru", name: "Russian",    label: "Русский" },
  { code: "tr", name: "Turkish",    label: "Türkçe" },
  { code: "hi", name: "Hindi",      label: "हिन्दी" },
  { code: "sv", name: "Swedish",    label: "Svenska" },
  { code: "uk", name: "Ukrainian",  label: "Українська" },
  { code: "vi", name: "Vietnamese", label: "Tiếng Việt" },
  { code: "id", name: "Indonesian", label: "Bahasa Indonesia" },
]);

export const LANG_CODES: readonly LangCode[] = Object.freeze(LANGUAGES.map((l) => l.code));

// Default language used when the client omits ?lang= — matches the original
// French-only behavior so existing integrations keep working.
export const DEFAULT_LANG: LangCode = "fr";

export function getLanguage(code: string): LangSpec | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function isLangCode(code: string): code is LangCode {
  return LANG_CODES.includes(code as LangCode);
}
