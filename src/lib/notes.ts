/**
 * Notes Generation Module
 *
 * This module handles AI-powered note generation using OpenAI's API.
 * It transforms raw video transcripts into structured, useful notes.
 *
 * Key responsibilities:
 * - Validates OpenAI API key is configured before processing
 * - Defines intent-specific prompts (learn, reference, action, overview)
 * - Calls OpenAI's chat completion API with the transcript
 * - Returns formatted Markdown notes tailored to the user's goal
 *
 * The four intents serve different use cases:
 * - learn: Detailed study notes with explanations and key concepts
 * - reference: Quick-lookup bullet points and facts
 * - action: Step-by-step instructions and how-to guides
 * - overview: Neutral, scope-only description (two-step pipeline)
 *
 * This is where raw transcripts become valuable, structured knowledge.
 */

import OpenAI from "openai";

export type Intent = "learn" | "reference" | "action" | "overview";
export type VideoType = "educational" | "entertainment";

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

Given a video transcript, create structured study notes that include:
- Key concepts with clear explanations
- Important definitions
- Main ideas and insights
- Logical organization with headers and subheaders

Format the notes in Markdown.
`,

  reference: `
You are a reference assistant.

Given a video transcript, create a concise reference document that includes:
- Bullet-point summary of key facts
- Important terms and definitions
- Notable quotes or statistics (if present)

Format the notes in Markdown for quick lookup.
`,

  action: `
You are a how-to assistant.

Given a video transcript, extract actionable steps that include:
- Numbered step-by-step instructions
- Prerequisites or requirements (if mentioned)
- Tips or warnings (only if explicitly stated)

Format the output in Markdown using numbered lists.
`,
};

/**
 * Overview prompts - Educational
 */
const EDUCATIONAL_OVERVIEW_PROMPT = `
Task: Overview Writing (Educational Content)

Write ONE natural, conversational sentence (15-25 words) describing what this educational video covers.

Tone: Casual and conversational—imagine telling a coworker what the video teaches or explains.

Guideline structure (flexible):
The video [verb] [topic], [verb] [topic], and [verb] [topic]

Instructional/explanatory verbs to use (pick 3 different ones):
- demonstrates, teaches, explains, walks through, covers, discusses, goes over, shows

IMPORTANT: 
- Use 3 different verbs for natural variety
- Feel free to vary the sentence structure—don't force the template if it sounds stiff
- Write naturally, as if casually describing the video to someone

FORBIDDEN words (do NOT use these or their variants):
- important, importance, valuable, value, successful, success, beneficial, benefits
- emphasizes, emphasize, highlights, highlight, key, critical, critically
- significant, significance, essential, crucial, matters, matter
- empowers, empower, empowering, empowerment, overcome, overcoming

Rules:
- Just describe WHAT the video covers—no opinions or why it matters
- Keep it simple and conversational
- Avoid stiff phrases like "various aspects of" or "for the purpose of"
- Don't use fancy academic language—keep it casual

Examples:

1. Tech Tutorial:
"The video demonstrates how to use React hooks, explains state management patterns, and walks through component lifecycle basics."

2. Science Education:
"The video teaches how photosynthesis works, explains what chloroplasts do, and covers how light becomes chemical energy."

3. Career Advice:
"The video discusses switching careers in tech, covers writing better resumes, and shows ways to network for job interviews."

4. Productivity/How-To:
"The video walks through time-blocking methods, explains the Pomodoro technique, and demonstrates different task management tools."

Transcript:
`;

/**
 * Overview prompts - Entertainment
 */
const ENTERTAINMENT_OVERVIEW_PROMPT = `
Task: Overview Writing (Entertainment Content)

Write ONE natural, conversational sentence (15-25 words) describing what this entertainment video is about.

Tone: Casual and conversational—imagine telling a coworker what the video shows or follows.

Guideline structure (flexible):
The video [verb] [topic], [verb] [topic], and [verb] [topic]

Narrative/experiential verbs to use (pick 3 different ones):
- follows, explores, showcases, depicts, chronicles, presents

IMPORTANT: 
- Use 3 different verbs for natural variety
- Feel free to vary the sentence structure—don't force the template if it sounds stiff
- Write naturally, as if casually describing the video to someone
- Focus on describing the EXPERIENCE or NARRATIVE, not instruction

DO NOT use instructional verbs:
- Do NOT use: demonstrates, teaches, explains, walks through (even if creator casually shares info)
- This is entertainment—describe what happens, not what is taught

FORBIDDEN words (do NOT use these or their variants):
- important, importance, valuable, value, successful, success, beneficial, benefits
- emphasizes, emphasize, highlights, highlight, key, critical, critically
- significant, significance, essential, crucial, matters, matter
- empowers, empower, empowering, empowerment, overcome, overcoming

Rules:
- Just describe WHAT the video is about—no opinions or why it matters
- Keep it simple and conversational
- Avoid stiff phrases like "various aspects of" or "for the purpose of"
- Don't use fancy academic language—keep it casual

Examples:

1. Gaming Stream:
"The video follows a player exploring a new game world, showcases combat mechanics, and depicts multiplayer interactions."

2. Travel Vlog:
"The video chronicles a trip through Japan, explores local cuisine, and showcases cultural experiences in Tokyo."

3. Lifestyle/Daily Vlog:
"The video follows a day in the creator's life, showcases their morning routine, and presents behind-the-scenes moments."

4. Storytelling/Narrative:
"The video depicts a group's road trip adventure, follows their challenges along the way, and explores small-town encounters."

Transcript:
`;

const EDUCATIONAL_OVERVIEW_SCOPE_PROMPT = `
Task: Subject Extraction (Educational Content)

From the transcript, identify exactly 3-4 main subjects being taught or explained.

Format:
Return as bullet points using this exact format:
- [Noun phrase]
- [Noun phrase]
- [Noun phrase]
- [Noun phrase]

Rules:
- Use concrete NOUN PHRASES only (no verbs, no actions, no adjectives)
- Each subject must be a primary topic, not a brief mention
- Do NOT include evaluative words (important, key, critical, essential, etc.)
- Do NOT include opinions, advice, or recommendations
- Do NOT describe value, benefits, or significance

Examples:

Tech Tutorial Transcript → Subjects:
- React hooks
- State management
- Component lifecycle
- Custom hooks

Science Education Transcript → Subjects:
- Photosynthesis process
- Chloroplasts
- Light reactions
- Carbon fixation

Career Advice Transcript → Subjects:
- Career transitions
- Resume writing strategies
- Networking approaches
- Interview preparation

Now extract 3-4 subjects from the transcript below.
`;

const ENTERTAINMENT_OVERVIEW_SCOPE_PROMPT = `
Task: Subject Extraction (Entertainment Content)

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

const EDUCATIONAL_OVERVIEW_REWRITE_PROMPT = `
Task: Overview Writing (Educational Content)

Using ONLY the subjects listed below, write ONE natural, conversational sentence (15-25 words).

Tone: Casual and conversational—like you're telling someone what the video teaches or explains.

Guideline structure (flexible):
The video [verb] [topic], [verb] [topic], and [verb] [topic]

Instructional/explanatory verbs (pick 3 different ones):
- demonstrates, teaches, explains, walks through, covers, discusses, goes over, shows

IMPORTANT: 
- Use a different verb for each subject
- Write naturally—don't force a rigid structure if it sounds awkward
- Keep it simple and conversational

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

Subjects: React hooks, State management, Component lifecycle
→ "The video demonstrates React hooks, explains how to manage state, and covers component lifecycle basics."

Subjects: Photosynthesis, Chloroplasts, Light energy conversion
→ "The video teaches how photosynthesis works, explains what chloroplasts do, and shows how light becomes chemical energy."

Subjects: Career transitions, Resume strategies, Networking approaches
→ "The video discusses switching careers in tech, covers writing better resumes, and walks through networking approaches for interviews."

Now write the overview using these subjects:

Subjects:
`;

const ENTERTAINMENT_OVERVIEW_REWRITE_PROMPT = `
Task: Overview Writing (Entertainment Content)

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
  intent: Intent,
  videoType: VideoType = "educational"
): Promise<string> {
  try {
    const openai = getOpenAIClient();

    if (intent === "overview") {
      // Temperature: 0.4 for natural, conversational phrasing
      // Higher temperature allows varied sentence structures while prompts maintain neutrality
      const OVERVIEW_TEMPERATURE = 0.4;

      // Select prompts based on video type
      const OVERVIEW_PROMPT =
        videoType === "educational"
          ? EDUCATIONAL_OVERVIEW_PROMPT
          : ENTERTAINMENT_OVERVIEW_PROMPT;
      const OVERVIEW_SCOPE_PROMPT =
        videoType === "educational"
          ? EDUCATIONAL_OVERVIEW_SCOPE_PROMPT
          : ENTERTAINMENT_OVERVIEW_SCOPE_PROMPT;
      const OVERVIEW_REWRITE_PROMPT =
        videoType === "educational"
          ? EDUCATIONAL_OVERVIEW_REWRITE_PROMPT
          : ENTERTAINMENT_OVERVIEW_REWRITE_PROMPT;

      // 1️⃣ Single-step attempt (fast)
      const singleStepResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: OVERVIEW_PROMPT },
          { role: "user", content: transcript },
        ],
        temperature: OVERVIEW_TEMPERATURE,
        max_tokens: 150,
      });

      let overview = singleStepResponse.choices[0]?.message?.content;

      // Enhanced regex to catch all forbidden words and derivatives
      const forbiddenWordsRegex =
        /\b(importan(ce|t)|valu(e|able)|success(ful)?|benefit(s|ial)|advice|emphasize[sd]?|highlight[sd]?|keys?|critical(ly)?|significan(ce|t)|essential|crucial|overcom(e|ing)|matter(s)?|empower(s|ing|ment)?)\b/i;

      // 2️⃣ Fallback to two-step if output is empty or contains unwanted phrases
      if (!overview || forbiddenWordsRegex.test(overview)) {
        // Debug logging (enable with DEBUG_OVERVIEW_PROMPTS=true)
        if (process.env.DEBUG_OVERVIEW_PROMPTS) {
          const reason = !overview
            ? "empty output"
            : "forbidden words detected";
          console.log("[Overview] Fallback triggered:", reason);
          console.log("[Overview] Single-step output:", overview || "(empty)");
          console.log("[Overview] Video type:", videoType);
          console.log("[Overview] Timestamp:", new Date().toISOString());
        }

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

        if (process.env.DEBUG_OVERVIEW_PROMPTS) {
          console.log("[Overview] Extracted subjects:", subjects);
        }

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

        overview = rewriteResponse.choices[0]?.message?.content;

        if (process.env.DEBUG_OVERVIEW_PROMPTS) {
          console.log("[Overview] Fallback complete. Final output:", overview);
        }
      }

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
