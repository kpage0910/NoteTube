# NoteTube

A tool that converts YouTube videos into structured, intent-based notes. Paste a link, choose how you want to consume the content, and get notes tailored to your goal.

## Overview

Watching a 30-minute video to extract a few key points is inefficient. This project solves that by pulling the transcript from any YouTube video and transforming it into notes shaped by what you actually need: studying, quick reference, step-by-step instructions, or just a fast summary.

The idea is simple: the same video content serves different purposes depending on your intent. A tutorial watched for learning requires different notes than the same tutorial used as a reference later. This tool makes that distinction explicit.

## Why This Project

I built this to solve a real problem I kept running into: jumping between videos, pausing to take notes, and losing context. Most note-taking tools treat all content the same way. I wanted something that adapts to how I plan to use the information.

Beyond the practical use case, this project was an exercise in building a complete, focused product from start to finish. The goal was not to build something impressive in scope, but to build something intentional in design. Every decision, from what to include to what to leave out, was made deliberately.

I also used this project to develop my ability to collaborate with AI as a learning partner. I treated AI as a tool for understanding concepts, exploring tradeoffs, and validating ideas, not as a replacement for thinking through the problem myself.

## Core User Flow

1. User pastes a YouTube URL
2. User selects an intent: Learn, Reference, Action, or Skim
3. System extracts the video transcript using yt-dlp
4. System sends the transcript to OpenAI with an intent-specific prompt
5. User receives formatted notes tailored to their selected intent
6. User can copy the notes to clipboard for use in any application

That's the entire loop. No accounts, no databases, no extra features.

## System Design (High Level)

The architecture is straightforward:

**Frontend**: A single React page built with Next.js. Handles the form input, intent selection, loading states, error display, and note rendering. No client-side routing, no state management libraries. Just React hooks and a form submission.

**Backend**: A single API route (\`/api/generate-notes\`) that orchestrates the two core operations:

- Transcript extraction via \`yt-dlp\`, a command-line tool that pulls subtitles from YouTube. The system downloads English captions (both manual and auto-generated), matches multiple English language variants (en, en-US, en-GB, en-orig), and falls back to other available languages if English isn't available. Temporary VTT files are cleaned up after processing.
- Note generation via OpenAI's API. Each intent (learn, reference, action, skim) has a dedicated system prompt that shapes how the model structures the output.

**Data Flow**: URL and intent go in, notes come out. There's no persistence layer. The transcript is processed in memory and discarded after the response is sent.

**Output Format**: Notes are generated in Markdown format by OpenAI and displayed as-is in the UI. When copied to clipboard, the notes are automatically converted to plain text with Unicode formatting (bullet points, clean headers) for maximum compatibility across applications like Word, Google Docs, Apple Notes, etc.

**Error Handling**: The API distinguishes between user errors (invalid URL, missing captions) and system errors (API failures), returning appropriate status codes and messages that surface clearly in the UI.

## Tech Stack

| Layer      | Technology               | Reason                                                                  |
| ---------- | ------------------------ | ----------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)  | Full-stack in one codebase, API routes without separate server          |
| Language   | TypeScript               | Type safety across the stack, better error catching during development  |
| Styling    | Tailwind CSS             | Rapid UI development without context-switching to CSS files             |
| AI         | OpenAI API (gpt-4o-mini) | Good balance of cost, speed, and output quality for text transformation |
| Transcript | yt-dlp                   | Reliable, actively maintained, handles YouTube's caption formats        |

No database. No authentication. No state management library. These weren't forgotten; they weren't needed for the core loop.

## Setup Requirements

To run this project locally, you'll need:

- Node.js and npm (for the Next.js application)
- yt-dlp installed on your system: `pip install yt-dlp`
- An OpenAI API key (set as `OPENAI_API_KEY` environment variable)

**Important**: Keep yt-dlp updated to ensure compatibility with YouTube's latest API changes. YouTube frequently updates their caption system, and older versions of yt-dlp may fail to detect available captions. Run `pip install --upgrade yt-dlp` periodically, especially if you encounter caption extraction issues.

## Design Decisions and Tradeoffs

**What I intentionally did not build:**

- **User accounts and saved notes**: Would require a database, authentication, and significantly more complexity. The value of this tool is in the transformation, not in storage. Users can copy their notes to any application they prefer.

- **Video metadata display (title, thumbnail, duration)**: Adds visual polish but doesn't improve the core function. Would require additional API calls and state management.

- **Multiple AI model options**: gpt-4o-mini handles this use case well. Adding model selection would complicate the UI and introduce inconsistent output quality.

- **Streaming responses**: Would improve perceived performance for long notes, but adds complexity to both the API and frontend. For a tool generating a few hundred words, the tradeoff wasn't worth it at this stage.

- **Custom intent prompts**: Users could theoretically want to define their own note format. I chose to constrain the options to four well-defined intents. Constraints often make tools more useful, not less.

**What I chose to prioritize:**

- Clear separation between transcript extraction and note generation
- Explicit error messages that tell users what went wrong
- A UI that doesn't require explanation
- Code that's readable without extensive comments

## Project Status

This is a working MVP ready for deployment. The core loop functions end-to-end: you can paste a YouTube URL, select an intent, and receive generated notes.

**Production readiness features:**

- **Rate limiting**: 5 requests per minute per IP address to prevent API abuse
- **Environment validation**: Checks for required OpenAI API key at runtime
- **Docker deployment**: Dockerfile configured with healthchecks for Railway/container platforms
- **Error handling**: Comprehensive error mapping with appropriate HTTP status codes

The application is configured for Railway deployment with automatic healthchecks and restart policies. While it lacks advanced monitoring and analytics, it has the essential protections needed for public use.

## Future Improvements

If I continue developing this project, these are the realistic next steps:

- **Transcript caching**: Store transcripts temporarily to avoid re-fetching for the same video with different intents
- **Better VTT parsing**: The current parser handles common cases but could be more robust with edge cases in auto-generated captions
- **Response streaming**: Improve perceived performance by streaming the AI response as it generates
- **Usage analytics**: Track request patterns and popular intents without requiring user accounts
- **Timestamp mapping**: Link notes back to specific points in the video (requires more sophisticated transcript parsing)
