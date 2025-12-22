"use client";

import { useState } from "react";
import Link from "next/link";

type Intent = "learn" | "reference" | "action" | "overview";
type VideoType = "educational" | "entertainment";

const intentOptions: { value: Intent; label: string; description: string }[] = [
  { value: "learn", label: "Learn", description: "Understand the material" },
  { value: "reference", label: "Reference", description: "Find facts quickly" },
  { value: "action", label: "Action", description: "Follow step-by-step" },
  { value: "overview", label: "Overview", description: "Get the main points" },
];

export default function AppPage() {
  const [url, setUrl] = useState("");
  const [intent, setIntent] = useState<Intent>("learn");
  const [videoType, setVideoType] = useState<VideoType>("educational");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Converts Markdown-formatted notes to plain text with Unicode formatting.
   * Strips Markdown syntax (headers, bold, italic, code) and replaces bullet
   * markers with Unicode bullet points (•) for maximum compatibility when
   * pasted into applications like Word, Google Docs, or Apple Notes.
   */
  function convertMarkdownToPlainText(markdown: string): string {
    let text = markdown;

    // Remove headers (# ## ### etc.)
    text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1");

    // Convert bullet points (-, *, +) to bullet character
    text = text.replace(/^(\s*)[*\-+]\s+/gm, "$1• ");

    // Remove bold (**text**)
    text = text.replace(/\*\*(.+?)\*\*/g, "$1");

    // Remove italic (*text* or _text_)
    text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1");
    text = text.replace(/_(.+?)_/g, "$1");

    // Remove code backticks
    text = text.replace(/`([^`]+)`/g, "$1");

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```\w*\n?/g, "").trim();
    });

    return text.trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotes("");
    setLoading(true);

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, intent, videoType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Copies notes to clipboard as plain text.
   * Converts Markdown formatting to Unicode characters before copying,
   * shows temporary "Copied!" feedback, and handles clipboard API errors.
   */
  async function handleCopy() {
    try {
      const plainText = convertMarkdownToPlainText(notes);
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy. Please try manually selecting the text.");
    }
  }

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Header — Minimal, just navigation back */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 sm:py-5">
          <Link
            href="/"
            className="inline-block text-sm font-medium text-zinc-900 transition-opacity hover:opacity-60 active:opacity-50 py-1"
          >
            NoteTube
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Page Title */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Generate Notes
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Paste a YouTube URL and choose your intent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* URL Input */}
          <div>
            <label
              htmlFor="url"
              className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3"
            >
              YouTube URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
              className="w-full px-3 sm:px-4 py-3 sm:py-3.5 rounded-md border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Video Type Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">
              What type of video is this?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setVideoType("educational")}
                className={`p-2.5 sm:p-3 rounded-md border-2 text-center transition-all active:scale-95 ${
                  videoType === "educational"
                    ? "border-zinc-900 bg-white"
                    : "border-zinc-200 bg-white hover:border-zinc-300 active:border-zinc-400"
                }`}
              >
                <span
                  className={`block text-sm font-medium ${
                    videoType === "educational"
                      ? "text-zinc-900"
                      : "text-zinc-600"
                  }`}
                >
                  Educational
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVideoType("entertainment")}
                className={`p-2.5 sm:p-3 rounded-md border-2 text-center transition-all active:scale-95 ${
                  videoType === "entertainment"
                    ? "border-zinc-900 bg-white"
                    : "border-zinc-200 bg-white hover:border-zinc-300 active:border-zinc-400"
                }`}
              >
                <span
                  className={`block text-sm font-medium ${
                    videoType === "entertainment"
                      ? "text-zinc-900"
                      : "text-zinc-600"
                  }`}
                >
                  Entertainment
                </span>
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {videoType === "educational"
                ? "Educational includes tutorials, lessons, how-tos, advice, and informational content"
                : "Entertainment includes vlogs, gaming, storytelling, lifestyle content, and casual videos"}
            </p>
          </div>

          {/* Intent Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">
              Intent
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
              {intentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIntent(option.value)}
                  className={`p-2.5 sm:p-3 rounded-md border text-left transition-all active:scale-95 ${
                    intent === option.value
                      ? "border-zinc-900 bg-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300 active:border-zinc-400"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${
                      intent === option.value ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`block text-xs mt-0.5 ${
                      intent === option.value
                        ? "text-zinc-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !url}
            className="w-full py-3 sm:py-3.5 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Notes"}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Notes Display */}
        {notes && (
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                Your Notes
              </h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-opacity hover:opacity-60 active:opacity-50 py-1 px-2 -mr-2"
              >
                <span>📋</span>
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <div className="p-4 sm:p-6 rounded-md border border-zinc-200 bg-zinc-50">
              <pre className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed font-[family-name:var(--font-geist-sans)] break-words">
                {notes}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
