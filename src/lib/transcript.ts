/**
 * Transcript Extraction Module
 *
 * This module handles extracting transcripts from YouTube videos using yt-dlp.
 * It's the foundation of the app—without a transcript, there's nothing to generate notes from.
 *
 * Key responsibilities:
 * - Extracts video IDs from various YouTube URL formats
 * - Downloads subtitle files using yt-dlp (prefers English, falls back to other languages)
 * - Parses VTT (WebVTT) subtitle format into clean plain text
 * - Manages temporary file creation and cleanup
 *
 * The extraction process:
 * 1. Parse the YouTube URL to get the video ID
 * 2. Use yt-dlp to download auto-generated or manual captions
 * 3. Parse the VTT file to extract just the spoken text
 * 4. Clean up temporary files and return the transcript
 *
 * Requires: yt-dlp must be installed on the system (brew install yt-dlp)
 */

import { execSync } from "child_process";
import { readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

/**
 * Extracts the video ID from a YouTube URL.
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parses VTT subtitle content and extracts plain text.
 */
function parseVTT(vttContent: string): string {
  const lines = vttContent.split("\n");
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip WEBVTT header and metadata
    if (
      trimmed === "WEBVTT" ||
      trimmed.startsWith("Kind:") ||
      trimmed.startsWith("Language:")
    ) {
      continue;
    }

    // Skip timestamp lines (e.g., "00:00:00.000 --> 00:00:05.000")
    if (trimmed.includes("-->")) {
      continue;
    }

    // Skip empty lines and cue identifiers (numbers)
    if (trimmed === "" || /^\d+$/.test(trimmed)) {
      continue;
    }

    // Skip lines that are just timestamps or positions
    if (trimmed.match(/^[\d:.,\s->]+$/)) {
      continue;
    }

    // Remove VTT tags like <c>, </c>, <00:00:00.000>, etc.
    const cleanedLine = trimmed
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (cleanedLine && !textLines.includes(cleanedLine)) {
      textLines.push(cleanedLine);
    }
  }

  return textLines.join(" ");
}

/**
 * Fetches the transcript for a YouTube video using yt-dlp.
 */
export async function getTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);

  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const tempId = randomUUID();
  const tempPath = join(tmpdir(), `yt-transcript-${tempId}`);

  try {
    let subtitleFile: string | null = null;

    // Try to download English subtitles (both manual and auto-generated)
    try {
      execSync(
        `yt-dlp --write-auto-sub --write-sub --sub-langs "en.*" --skip-download --sub-format vtt -o "${tempPath}" "https://www.youtube.com/watch?v=${videoId}"`,
        { encoding: "utf-8", timeout: 60000, stdio: "pipe" }
      );

      // Check for English subtitle file (any variant)
      const possibleFiles = [
        `${tempPath}.en.vtt`,
        `${tempPath}.en-US.vtt`,
        `${tempPath}.en-GB.vtt`,
        `${tempPath}.en-orig.vtt`,
      ];
      subtitleFile = possibleFiles.find((f) => existsSync(f)) || null;
    } catch (e) {
      // Command might fail but still create the file
      const possibleFiles = [
        `${tempPath}.en.vtt`,
        `${tempPath}.en-US.vtt`,
        `${tempPath}.en-GB.vtt`,
        `${tempPath}.en-orig.vtt`,
      ];
      subtitleFile = possibleFiles.find((f) => existsSync(f)) || null;
    }

    // If no English, try to get any available subtitle
    if (!subtitleFile) {
      try {
        // Get list of available auto-captions
        const listOutput = execSync(
          `yt-dlp --list-subs "https://www.youtube.com/watch?v=${videoId}"`,
          { encoding: "utf-8", timeout: 30000, stdio: "pipe" }
        );

        // Find the first available auto-caption language
        const autoLangMatch = listOutput.match(
          /^([a-z]{2}(?:-[A-Za-z]+)?)\s+.*vtt/m
        );

        if (autoLangMatch) {
          const sourceLang = autoLangMatch[1];

          // Download the auto-caption in source language
          try {
            execSync(
              `yt-dlp --write-auto-sub --sub-langs "${sourceLang}" --skip-download --sub-format vtt -o "${tempPath}" "https://www.youtube.com/watch?v=${videoId}"`,
              { encoding: "utf-8", timeout: 60000, stdio: "pipe" }
            );
          } catch {
            // Ignore errors, check if file exists
          }

          const sourceFile = `${tempPath}.${sourceLang}.vtt`;
          if (existsSync(sourceFile)) {
            subtitleFile = sourceFile;
          }
        }
      } catch {
        // Continue to error handling
      }
    }

    if (!subtitleFile || !existsSync(subtitleFile)) {
      throw new Error("No transcript available for this video");
    }

    // Read and parse the VTT file
    const vttContent = readFileSync(subtitleFile, "utf-8");
    const transcript = parseVTT(vttContent);

    // Clean up temp files
    try {
      const files = [
        `${tempPath}.en.vtt`,
        `${tempPath}.en-orig.vtt`,
        `${tempPath}.ar.vtt`,
      ];
      for (const file of files) {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      }
      // Also clean up any other subtitle files
      execSync(`rm -f "${tempPath}"*.vtt 2>/dev/null`, { encoding: "utf-8" });
    } catch {
      // Ignore cleanup errors
    }

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Transcript is empty");
    }

    return transcript;
  } catch (error) {
    // Clean up on error
    try {
      execSync(`rm -f "${tempPath}"*.vtt 2>/dev/null`, { encoding: "utf-8" });
    } catch {
      // Ignore
    }

    if (error instanceof Error) {
      if (
        error.message.includes("No transcript") ||
        error.message.includes("empty")
      ) {
        throw new Error(
          "No transcript available for this video. The video may not have captions."
        );
      }
    }

    throw new Error("Could not fetch transcript. Please try again.");
  }
}
