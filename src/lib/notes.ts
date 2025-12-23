/**
 * Notes Generation Module
 *
 * This module handles AI-powered note generation using OpenAI's API.
 * It transforms raw video transcripts into structured, useful notes.
 *
 * Key responsibilities:
 * - Validates OpenAI API key is configured before processing
 * - Defines intent-specific prompts (learn, action, overview)
 * - Calls OpenAI's chat completion API with the transcript
 * - Returns formatted Markdown notes tailored to the user's goal
 *
 * The three intents serve different use cases:
 * - learn: Detailed study notes with explanations and key concepts
 * - action: Step-by-step instructions and how-to guides
 * - overview: Neutral, scope-only description (two-step pipeline)
 *
 * This is where raw transcripts become valuable, structured knowledge.
 */

import OpenAI from "openai";

export type Intent = "learn" | "action" | "overview";

/**
 * Get or create OpenAI client (lazy initialization)
 */
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Single-prompt intents (overview intentionally excluded)
 */
const intentPrompts: Record<Exclude<Intent, "overview">, string> = {
  learn: `
You are a learning assistant. 

Given a video transcript, create structured study notes that are beginner-friendly. Avoid using Markdown symbols (#, ##, *, etc.) and avoid LaTeX formatting. Use plain text with headings, subheadings, and bullet points. Explain formulas in words or using simple symbols like +, -, *, /. Keep explanations simple and clear for someone new to the topic. 

Include:
- Clear headings and subheadings
- Bullet points for main ideas
- Definitions of key terms in simple language
- Step-by-step explanations for formulas or methods
- Short examples if helpful

Focus only on what is explained in the video. These notes are for a surface-level understanding to help someone follow along with the video.


`,

  action: `
You are an action extraction assistant.

Given a video transcript, extract actions the speaker explicitly or implicitly recommends the viewer take.

Rules:
- Do NOT add new advice or improve the steps
- Do NOT generalize beyond what the video discusses
- Prefer concrete, actionable tasks over vague motivation
- Exclude calls to like, subscribe, or follow unless they are central to the video
- If no meaningful actions are present, say: “No clear actions identified.”

Output format:

Goal:
- One sentence describing what the viewer is trying to achieve, based strictly on the video.

Steps:
- Numbered list of actions the viewer could take
- Preserve the scope and specificity of the video







`,
};

/**
 * Overview prompt for initial scope extraction
 */
const OVERVIEW_SCOPE_PROMPT = `
Task: Subject Extraction

From the transcript, identify exactly 3-4 main subjects, experiences, or narrative elements.

Format:
Return as bullet points using this exact format:
- [Noun phrase]
- [Noun phrase]
- [Noun phrase]
- [Noun phrase]

Rules:
- Use concrete NOUN PHRASES only (no verbs, no actions, no adjectives)
- Each subject must be a primary topic, not a brief mention
- Focus on experiences, activities, places, or narrative elements—not lessons
- Do NOT include evaluative words (important, key, critical, essential, etc.)
- Do NOT include opinions, advice, or recommendations
- Do NOT describe value, benefits, or significance

Examples:

Gaming Stream Transcript → Subjects:
- Game world exploration
- Combat mechanics
- Multiplayer interactions
- Character progression

Travel Vlog Transcript → Subjects:
- Japan trip
- Local cuisine experiences
- Tokyo cultural sites
- Travel challenges

Lifestyle Vlog Transcript → Subjects:
- Daily routine
- Morning activities
- Behind-the-scenes moments
- Personal experiences

Now extract 3-4 subjects from the transcript below.
`;

/**
 * Overview prompt for rewriting extracted subjects into a sentence
 */
const OVERVIEW_REWRITE_PROMPT = `
Task: Overview Writing

Using ONLY the subjects listed below, write ONE natural, conversational sentence (15-25 words).

Tone: Casual and conversational—like you're telling someone what the video is about.

Guideline structure (flexible):
The video [verb] [topic], [verb] [topic], and [verb] [topic]

Narrative/experiential verbs (pick 3 different ones):
- follows, explores, showcases, depicts, chronicles, presents

IMPORTANT: 
- Use a different verb for each subject
- Write naturally—don't force a rigid structure if it sounds awkward
- Keep it simple and conversational
- Focus on describing the EXPERIENCE or NARRATIVE, not instruction

DO NOT use instructional verbs:
- Do NOT use: demonstrates, teaches, explains, walks through, covers, discusses, goes over
- Even if the creator shares information, describe it as narrative/experience
- This is entertainment—describe what happens, not what is taught

FORBIDDEN words (do NOT use):
- important, importance, valuable, value, successful, success, beneficial, benefits
- emphasizes, emphasize, highlights, highlight, key, critical, critically
- significant, significance, essential, crucial, matters, matter
- empowers, empower, empowering, empowerment, overcome, overcoming

Rules:
- Combine subjects into one natural, flowing sentence
- Use 3 different verbs
- Keep it conversational—avoid stiff academic phrasing
- Write like you're casually describing the video to someone

Examples:

Subjects: Game world exploration, Combat mechanics, Multiplayer interactions
→ "The video follows a player exploring a new game world, showcases combat mechanics, and depicts multiplayer interactions."

Subjects: Japan trip, Local cuisine, Tokyo cultural sites
→ "The video chronicles a trip through Japan, explores local cuisine experiences, and showcases cultural sites in Tokyo."

Subjects: Daily routine, Morning activities, Behind-the-scenes moments
→ "The video follows the creator's daily routine, presents morning activities, and showcases behind-the-scenes moments."

Now write the overview using these subjects:

Subjects:
`;

/**
 * Generates notes for all intents
 */
export async function generateNotes(
  transcript: string,
  intent: Intent
): Promise<string> {
  try {
    const openai = getOpenAIClient();

    if (intent === "overview") {
      // Temperature: 0.4 for natural, conversational phrasing
      // Higher temperature allows varied sentence structures while prompts maintain neutrality
      const OVERVIEW_TEMPERATURE = 0.4;

      // Step 1: Extract subjects
      const scopeResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: OVERVIEW_SCOPE_PROMPT },
          { role: "user", content: transcript },
        ],
        temperature: 0, // Deterministic for subject extraction
        max_tokens: 200,
      });

      const subjects = scopeResponse.choices[0]?.message?.content;
      if (!subjects) throw new Error("Failed to extract subjects");

      // Step 2: Rewrite as overview
      const rewriteResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: OVERVIEW_REWRITE_PROMPT + "\n" + subjects,
          },
        ],
        temperature: OVERVIEW_TEMPERATURE,
        max_tokens: 150,
      });

      const overview = rewriteResponse.choices[0]?.message?.content;
      if (!overview) throw new Error("Failed to generate overview");
      return overview;
    }

    // DEFAULT: single-step intents
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: intentPrompts[intent] },
        { role: "user", content: transcript },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const notes = response.choices[0]?.message?.content;
    if (!notes) throw new Error("No content returned from model");
    return notes;
  } catch (error) {
    throw new Error("Failed to generate notes");
  }
}
