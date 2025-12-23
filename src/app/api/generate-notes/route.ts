/**
 * API Route: /api/generate-notes
 *
 * This is the main orchestration endpoint for the NoteTube application.
 * It connects the frontend to the transcript extraction and note generation logic.
 *
 * Flow:
 * 1. Receives a YouTube URL and user intent (learn, action, overview)
 * 2. Rate limits requests (5 per minute per IP) to prevent API abuse
 * 3. Validates the input
 * 4. Calls getTranscript() to extract the video's captions
 * 5. Calls generateNotes() to transform the transcript into structured notes
 * 6. Returns the generated notes or an appropriate error
 *
 * Rate limiting uses simple in-memory tracking and resets every minute.
 * Environment validation ensures OpenAI API key is configured before processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTranscript } from "@/lib/transcript";
import { generateNotes, Intent } from "@/lib/notes";

const validIntents: Intent[] = ["learn", "action", "overview"];

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { url, intent } = body;

    // Validate input
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    if (!intent || !validIntents.includes(intent)) {
      return NextResponse.json(
        {
          error: "Valid intent is required (learn, action, overview)",
        },
        { status: 400 }
      );
    }

    // Get transcript
    const transcript = await getTranscript(url);

    // Generate notes
    const notes = await generateNotes(transcript, intent as Intent);

    return NextResponse.json({ notes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Map known errors to appropriate status codes
    if (message === "Invalid YouTube URL") {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (
      message ===
        "Could not fetch transcript. The video may not have captions enabled." ||
      message === "No transcript available for this video"
    ) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    if (message === "Failed to generate notes") {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
