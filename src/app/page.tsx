"use client";

import { useState } from "react";

type Intent = "learn" | "reference" | "action" | "skim";

const intentOptions: { value: Intent; label: string; description: string }[] = [
  { value: "learn", label: "Learn", description: "Structured study notes" },
  {
    value: "reference",
    label: "Reference",
    description: "Key facts & definitions",
  },
  {
    value: "action",
    label: "Action",
    description: "Step-by-step instructions",
  },
  { value: "skim", label: "Skim", description: "Brief overview" },
];

export default function Home() {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          NoteTube
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Transform any YouTube video into structured, intent-based notes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          {/* URL Input */}
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
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
              className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Intent Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              What&apos;s your intent?
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {intentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIntent(option.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    intent === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <span
                    className={`block font-medium ${
                      intent === option.value
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
            className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generating..." : "Generate Notes"}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-8">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Notes Display */}
        {notes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Generated Notes
              </h2>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Download .txt
              </button>
            </div>
            <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <pre className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed font-sans">
                {notes}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
