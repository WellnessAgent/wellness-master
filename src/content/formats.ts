// The 18 wellness formats served by the API.
//
// Each entry owns a `prompt(lang)` builder that produces a single self-contained
// item in the requested target language. The LLM is instructed explicitly to
// output ONLY the item content (no preamble, no numbering, no quotes) so the
// raw response can be stored verbatim after minimal cleanup.
//
// `label` and `description` are English metadata exposed via GET /formats.
// Localized labels for UI rendering can be layered on by consumers if needed.

import type { LangSpec } from "./languages.js";
import { audienceSpec, type AudienceId } from "./audiences.js";

export type FormatId =
  | "joke"
  | "haiku"
  | "kudo"
  | "quote"
  | "fortune"
  | "affirmation"
  | "absurd"
  | "gratitude"
  | "koan"
  | "micro_poem"
  // Bonus set
  | "mantra"
  | "doom_antidote"
  | "absurd_compliment"
  | "world_proverb"
  | "riddle"
  | "micro_challenge"
  | "fictional_message"
  | "joyful_fact";

export type FormatSpec = {
  id: FormatId;
  label: string;
  description: string;
  /**
   * Target-language prompt builder. Audience-agnostic at this layer; the
   * audience hint is layered on top by `buildPrompt(format, lang, audience)`
   * to avoid duplicating the prompt body 18× × 2.
   */
  prompt: (lang: LangSpec) => string;
  temperature: number;                // creativity knob per format
  maxChars: number;                   // cap on item length (validation / truncation)
};

/**
 * Compose the final prompt sent to the LLM = format prompt + audience hint.
 * Always pass through this builder; never call `format.prompt(lang)` directly
 * outside of tests.
 */
export function buildPrompt(
  format: FormatSpec,
  lang: LangSpec,
  audience: AudienceId,
): string {
  return format.prompt(lang) + "\n\n" + audienceSpec(audience).promptHint;
}

const only = (lang: LangSpec) =>
  `Output ONLY the requested content, written in ${lang.name}. No preamble, no meta-commentary.`;

export const FORMATS: readonly FormatSpec[] = Object.freeze([
  {
    id: "joke",
    label: "Joke",
    description: "Short playful joke that defuses tension.",
    prompt: (lang) =>
      `Tell ONE short joke in ${lang.name}, 1 to 3 sentences, funny without being mean. ` +
      `No numbering, no quotes. ${only(lang)}`,
    temperature: 0.9,
    maxChars: 400,
  },
  {
    id: "haiku",
    label: "Haiku",
    description: "Short poem that recenters on the present moment (5-7-5).",
    prompt: (lang) =>
      `Write ONE haiku in ${lang.name}: three lines following a 5-7-5 syllabic pattern, about nature, ` +
      `the present moment, or a small everyday thing. Return ONLY the three lines separated by newlines. ` +
      `No title. ${only(lang)}`,
    temperature: 0.8,
    maxChars: 200,
  },
  {
    id: "kudo",
    label: "Kudo",
    description: "Unconditional appreciation, addressed to the reader.",
    prompt: (lang) =>
      `Address the reader directly with ONE warm sentence of unconditional appreciation (no conditions, ` +
      `no bargaining), in ${lang.name}. Single sentence, gentle tone, 100 to 200 characters. ${only(lang)}`,
    temperature: 0.7,
    maxChars: 300,
  },
  {
    id: "quote",
    label: "Quote",
    description: "Distilled wisdom in one sentence.",
    prompt: (lang) =>
      `Invent OR cite a short striking quote in ${lang.name}, about life, patience, or courage. ` +
      `Format: « text » — Author. Single quote. If you cite a real author, stay faithful; ` +
      `otherwise invent a plausible one. ${only(lang)}`,
    temperature: 0.7,
    maxChars: 300,
  },
  {
    id: "fortune",
    label: "Fortune cookie",
    description: "Light wisdom in the style of a fortune cookie.",
    prompt: (lang) =>
      `Write ONE fortune-cookie message in ${lang.name}, a single sentence with a mysterious and benevolent tone. ` +
      `50 to 150 characters. No lucky number. ${only(lang)}`,
    temperature: 0.85,
    maxChars: 200,
  },
  {
    id: "affirmation",
    label: "Affirmation",
    description: "First-person, present-tense phrase to reframe the mind.",
    prompt: (lang) =>
      `Write ONE positive affirmation in ${lang.name}, in first person, present tense, with no negation. ` +
      `Single sentence, 80 to 180 characters. ${only(lang)}`,
    temperature: 0.6,
    maxChars: 200,
  },
  {
    id: "absurd",
    label: "Absurd micro-story",
    description: "Gentle absurdism that puts things in perspective.",
    prompt: (lang) =>
      `Write ONE absurd micro-story in ${lang.name}, 1 to 3 sentences, that makes the reader smile through ` +
      `gentle absurdity. Mix the everyday with the improbable (lawyer pigeons, shy staircases, clouds on strike). ${only(lang)}`,
    temperature: 0.95,
    maxChars: 400,
  },
  {
    id: "gratitude",
    label: "Gratitude prompt",
    description: "Concrete reminder of what is already good.",
    prompt: (lang) =>
      `Write ONE gratitude reminder in ${lang.name}, a single sentence pointing to a tangible and universal ` +
      `thing already present (air, light, a working sense, a routine). 100 to 200 characters. ${only(lang)}`,
    temperature: 0.6,
    maxChars: 250,
  },
  {
    id: "koan",
    label: "Zen kōan",
    description: "Paradox that short-circuits the anxious mind.",
    prompt: (lang) =>
      `Write ONE Zen kōan in ${lang.name}: 1 to 3 sentences, paradoxical, contemplative, with no explicit answer. ` +
      `No moral. ${only(lang)}`,
    temperature: 0.85,
    maxChars: 300,
  },
  {
    id: "micro_poem",
    label: "Micro-poem",
    description: "Ultra-short poetry with a strong image.",
    prompt: (lang) =>
      `Write ONE micro-poem in ${lang.name}, 2 to 4 short lines, with a strong concrete image. ` +
      `No title. ${only(lang)}`,
    temperature: 0.9,
    maxChars: 300,
  },
  // ------ Bonus formats ------
  {
    id: "mantra",
    label: "Mantra",
    description: "Rhythmic, repeatable short phrase to settle the mind.",
    prompt: (lang) =>
      `Write ONE mantra in ${lang.name}, 4 to 8 words, rhythmic, slowly repeatable on the breath. ${only(lang)}`,
    temperature: 0.7,
    maxChars: 80,
  },
  {
    id: "doom_antidote",
    label: "Doomscrolling antidote",
    description: "Recent, plausible positive fact about the world.",
    prompt: (lang) =>
      `State ONE recent and plausible positive fact about the world (health, environment, education, ` +
      `poverty), in ${lang.name}. One to two sentences, sober and factual. Do not invent numbers. ${only(lang)}`,
    temperature: 0.5,
    maxChars: 350,
  },
  {
    id: "absurd_compliment",
    label: "Absurd compliment",
    description: "Playful, off-kilter praise.",
    prompt: (lang) =>
      `Give the reader ONE absurd compliment in ${lang.name}, with a playful image and a kind tone ` +
      `(e.g., "you are as sturdy as a cast-iron pot"). Single sentence. ${only(lang)}`,
    temperature: 0.9,
    maxChars: 200,
  },
  {
    id: "world_proverb",
    label: "World proverb",
    description: "Proverb from a world culture, translated to the target language.",
    prompt: (lang) =>
      `Give ONE proverb from a world culture (African, Japanese, Irish, Inuit, Persian, etc.), translated ` +
      `into ${lang.name}, with its cultural origin in parentheses. Format: « text » (origin). ${only(lang)}`,
    temperature: 0.7,
    maxChars: 300,
  },
  {
    id: "riddle",
    label: "Riddle",
    description: "Light cognitive nudge, answer included.",
    prompt: (lang) =>
      `Pose ONE short riddle in ${lang.name}, on two lines: the question, then "Answer: …" on the second line. ` +
      `No numbering. ${only(lang)}`,
    temperature: 0.8,
    maxChars: 300,
  },
  {
    id: "micro_challenge",
    label: "Micro-challenge",
    description: "Playful task doable in under a minute.",
    prompt: (lang) =>
      `Suggest ONE playful micro-challenge in ${lang.name}, doable in under 60 seconds where the reader is. ` +
      `One to two gentle imperative sentences (e.g., "name 5 red things around you"). ${only(lang)}`,
    temperature: 0.8,
    maxChars: 300,
  },
  {
    id: "fictional_message",
    label: "Message from a fictional character",
    description: "Short kind message attributed to a fictional character.",
    prompt: (lang) =>
      `Write ONE short kind message (1 to 2 sentences) in ${lang.name}, addressed to the reader, from a famous ` +
      `fictional character (Gandalf, Yoda, Dumbledore, Mary Poppins, etc.). Format: « text » — Character. ` +
      `Respect the character's voice. ${only(lang)}`,
    temperature: 0.85,
    maxChars: 350,
  },
  {
    id: "joyful_fact",
    label: "Joyful fact",
    description: "Natural-history fact that brings a smile.",
    prompt: (lang) =>
      `State ONE joyful and true natural-history fact in ${lang.name}, in the spirit of "otters hold hands ` +
      `while sleeping". Single sentence, 80 to 200 characters. ${only(lang)}`,
    temperature: 0.7,
    maxChars: 250,
  },
]);

export const FORMAT_IDS: readonly FormatId[] = Object.freeze(FORMATS.map((f) => f.id));

export function getFormat(id: string): FormatSpec | undefined {
  return FORMATS.find((f) => f.id === id);
}
