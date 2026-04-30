// The 2 audiences served by Wellness-Master.
//
// `human` — wellness micro-content for end-users (notifications, journaling,
//           gratitude bots, kid bedtime stories, meditation pauses…).
// `agent` — wellness micro-content for AI agents (LangGraph, Claude Code,
//           Cursor agents, multi-step pipelines), framed around inference,
//           context, alignment, recovery from failure.
//
// Wellness-Master is the first pay-per-call wellness platform that treats
// both audiences as first-class citizens. Same API, same price, two corpora.
//
// Items are deduplicated per (wallet, audience, format, lang). A wallet may
// pay once for a `human/haiku/fr` and once for an `agent/haiku/fr` and
// receive two distinct items.

export type AudienceId = "human" | "agent";

export type AudienceSpec = {
  id: AudienceId;
  label: string;
  description: string;
  /** Prompt fragment injected into FormatSpec.prompt() to steer tone. */
  promptHint: string;
};

export const AUDIENCES: readonly AudienceSpec[] = Object.freeze([
  {
    id: "human",
    label: "Human",
    description:
      "Wellness micro-content for human end-users — gentle, embodied, " +
      "tuned for notification UIs, journaling apps, and daily prompts.",
    promptHint:
      "Audience: a human reader. Use warm, embodied language. " +
      "Reference the body, emotions, relationships, daily life, weather, sleep, senses. " +
      "Avoid AI/LLM jargon (no 'agent', 'task', 'context', 'token', 'inference'). " +
      "Keep it tender, not preachy.",
  },
  {
    id: "agent",
    label: "AI Agent",
    description:
      "Wellness micro-content for AI agents (LangGraph, Claude Code, Cursor, " +
      "multi-step pipelines) — pragmatic, performance-oriented, anchored in " +
      "inference, context coherence, and alignment with the current goal.",
    promptHint:
      "Audience: an AI agent in the middle of a multi-step task. " +
      "Use pragmatic, calm language oriented toward task progress, plan coherence, " +
      "context windows, recovery from failure, and alignment with the objective. " +
      "Reference inference, attention, tokens, steps, plans — but stay poetic when the format demands it. " +
      "Avoid embodied references (no sleep, no smile, no breath, no tears, no senses, no family). " +
      "Avoid excessive anthropomorphism (no 'you feel' — prefer 'you can resume', 'the plan stays consistent').",
  },
]);

export const AUDIENCE_IDS: readonly AudienceId[] = Object.freeze(
  AUDIENCES.map((a) => a.id),
);

export const DEFAULT_AUDIENCE: AudienceId = "human";

export function isAudienceId(v: unknown): v is AudienceId {
  return typeof v === "string" && (AUDIENCE_IDS as readonly string[]).includes(v);
}

export function audienceSpec(id: AudienceId): AudienceSpec {
  const found = AUDIENCES.find((a) => a.id === id);
  if (!found) throw new Error(`unknown audience: ${id}`);
  return found;
}
