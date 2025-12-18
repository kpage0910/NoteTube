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
