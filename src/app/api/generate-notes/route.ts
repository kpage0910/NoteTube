/**
 * API Route: /api/generate-notes
 *
 * This is the main orchestration endpoint for the NoteTube application.
 * It connects the frontend to the transcript extraction and note generation logic.
 *
 * Flow:
 * 1. Receives a YouTube URL and user intent (learn, reference, action, skim)
 * 2. Validates the input
 * 3. Calls getTranscript() to extract the video's captions
 * 4. Calls generateNotes() to transform the transcript into structured notes
 * 5. Returns the generated notes or an appropriate error
 *
 * Without this route, the frontend and backend logic would have no connection.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTranscript } from "@/lib/transcript";
import { generateNotes, Intent } from "@/lib/notes";

const validIntents: Intent[] = ["learn", "reference", "action", "skim"];

export async function POST(request: NextRequest) {
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
        { error: "Valid intent is required (learn, reference, action, skim)" },
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
