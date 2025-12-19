import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-[family-name:var(--font-geist-sans)]">

      {/* Navigation — Minimal header with logo and CTA */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            NoteTube
          </span>
          <Link
            href="/app"
            className="px-4 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium transition-opacity hover:opacity-80"
          >
            Try it free
          </Link>
        </div>
      </header>

      <main>

        {/* Hero — Large headline, clear value prop, primary CTA */}
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
            Turn YouTube videos into
            <br className="hidden sm:block" />
            structured notes
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Stop rewatching. Get notes tailored to how you actually want to use the content.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium transition-opacity hover:opacity-80"
            >
              Try NoteTube — it&apos;s free
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-3 rounded-lg text-zinc-600 dark:text-zinc-400 text-sm font-medium transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              See how it works
            </a>
          </div>
        </section>

        {/* Problem Statement — Subtle background, centered text */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20 text-center">
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Most videos take longer to watch than the information inside them
              deserves. People come to videos with different goals—learning
              something new, finding a specific answer, following instructions, or
              just getting the gist. Notes should reflect those goals.
            </p>
          </div>
        </section>

        {/* How It Works — Three-step grid with numbered cards */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <h2 className="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest text-center mb-12">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Paste a link", description: "Drop any YouTube URL with captions" },
              { step: "2", title: "Choose your intent", description: "Select how you want to use the content" },
              { step: "3", title: "Get your notes", description: "Receive structured notes in seconds" },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Intent Types — Feature cards grid */}
        <section className="mx-auto max-w-5xl px-6 pb-20 sm:pb-28">
          <h2 className="text-xs font-medium text-zinc-400 dark:text-zinc-600 uppercase tracking-widest text-center mb-12">
            Choose your intent
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Learn", description: "Understand the material with explanations and examples" },
              { name: "Reference", description: "Find facts, definitions, and key points quickly" },
              { name: "Action", description: "Get step-by-step instructions to follow along" },
              { name: "Overview", description: "Skim the main ideas without the details" },
            ].map((intent) => (
              <div
                key={intent.name}
                className="p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
              >
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1.5">
                  {intent.name}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
                  {intent.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA — Simple centered section */}
        <section className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
              Ready to try it?
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-500 mb-8">
              No account required. Just paste a link and go.
            </p>
            <Link
              href="/app"
              className="inline-block px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium transition-opacity hover:opacity-80"
            >
              Try NoteTube — it&apos;s free
            </Link>
          </div>
        </section>

      </main>

      {/* Footer — Minimal */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-400 dark:text-zinc-600">
            NoteTube
          </span>
          <span className="text-sm text-zinc-400 dark:text-zinc-600">
            Built for learners.
          </span>
        </div>
      </footer>

    </div>
  );
}
