/**
 * Notes Generation Module
 *
 * This module handles AI-powered note generation using OpenAI's API.
 * It transforms raw video transcripts into structured, useful notes.
 *
 * Key responsibilities:
 * - Validates OpenAI API key is configured before processing
 * - Defines intent-specific prompts (learn, reference, action, skim)
 * - Calls OpenAI's chat completion API with the transcript
 * - Returns formatted Markdown notes tailored to the user's goal
 *
 * The four intents serve different use cases:
 * - learn: Detailed study notes with explanations and key concepts
 * - reference: Quick-lookup bullet points and facts
 * - action: Step-by-step instructions and how-to guides
 * - skim: Ultra-brief summary for quick understanding
 *
 * This is where raw transcripts become valuable, structured knowledge.
 */

import OpenAI from "openai";

export type Intent = "learn" | "reference" | "action" | "skim";

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
 * Intent-specific system prompts.
 * These guide the AI to generate notes in different formats based on user intent.
 */
const intentPrompts: Record<Intent, string> = {
  learn: `You are a learning assistant. Given a video transcript, create structured study notes that include:
- Key concepts with clear explanations
- Important definitions
- Main takeaways and insights
- Logical organization with headers and subheaders
Format the notes in Markdown for readability.`,

  reference: `You are a reference assistant. Given a video transcript, create a concise reference document that includes:
- Bullet-point summary of key facts
- Important definitions and terms
- Notable quotes or statistics
- Quick-lookup friendly format
Format the notes in Markdown with clear bullet points.`,

  action: `You are a how-to assistant. Given a video transcript, extract actionable steps that include:
- Numbered step-by-step instructions
- Required materials or prerequisites (if mentioned)
- Tips or warnings for each step
- Clear, actionable language
Format the notes in Markdown with numbered lists.`,

  skim: `You are a summarization assistant. Given a video transcript, provide:
- A brief 2-3 sentence overview of the main topic
- The single most important takeaway
Keep it extremely concise and scannable.`,
};

/**
 * Generates intent-based notes from a transcript using OpenAI.
 * @param transcript - The video transcript text
 * @param intent - The user's intent for the notes
 * @returns Generated notes as a string
 * @throws "Failed to generate notes" if the API call fails
 */
export async function generateNotes(
  transcript: string,
  intent: Intent
): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: intentPrompts[intent],
        },
        {
          role: "user",
          content: `Here is the video transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const notes = response.choices[0]?.message?.content;

    if (!notes) {
      throw new Error("No content in response");
    }

    return notes;
  } catch {
    throw new Error("Failed to generate notes");
  }
}
