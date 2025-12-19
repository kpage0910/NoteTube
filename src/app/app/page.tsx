"use client";

import { useState } from "react";
import Link from "next/link";

type Intent = "learn" | "reference" | "action" | "skim";

const intentOptions: { value: Intent; label: string; description: string }[] = [
  { value: "learn", label: "Learn", description: "Understand the material" },
  { value: "reference", label: "Reference", description: "Find facts quickly" },
  { value: "action", label: "Action", description: "Follow step-by-step" },
  { value: "skim", label: "Overview", description: "Get the main points" },
];

export default function AppPage() {
  const [url, setUrl] = useState("");
  const [intent, setIntent] = useState<Intent>("learn");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotes("");
    setLoading(true);

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, intent }),
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

  function handleDownload() {
    const blob = new Blob([notes], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "notes.txt";
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">

      {/* Header — Minimal, just navigation back */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 transition-opacity hover:opacity-60"
          >
            NoteTube
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">

        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Generate Notes
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Paste a YouTube URL and choose your intent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* URL Input */}
          <div>
            <label
              htmlFor="url"
              className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3"
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
              className="w-full px-4 py-3 rounded-md border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Intent Selection */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Intent
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {intentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIntent(option.value)}
                  className={`p-3 rounded-md border text-left transition-all ${
                    intent === option.value
                      ? "border-zinc-900 bg-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${
                      intent === option.value
                        ? "text-white"
                        : "text-zinc-900"
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
            className="w-full py-3 px-4 rounded-md bg-zinc-900 text-white text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Notes"}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-8 p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Notes Display */}
        {notes && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                Your Notes
              </h2>
              <button
                onClick={handleDownload}
                className="text-xs font-medium text-zinc-500 transition-opacity hover:opacity-60"
              >
                Download .txt
              </button>
            </div>
            <div className="p-6 rounded-md border border-zinc-200 bg-zinc-50">
              <pre className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed font-[family-name:var(--font-geist-sans)]">
                {notes}
              </pre>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
