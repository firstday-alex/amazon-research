"use client";

import { useState } from "react";
import { KeywordForm } from "@/components/KeywordForm";
import { ResultsView } from "@/components/ResultsView";
import type { AnalysisResult } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(params: {
    keyword: string;
    productLimit: number;
    reviewsPerProduct: number;
    country: string;
  }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-6xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted">
            Amazon Review Insights
          </span>
        </div>
        <h1 className="text-4xl font-bold text-ink leading-tight max-w-2xl">
          Mine top-ranking Amazon reviews for{" "}
          <span className="text-accent">creative ad angles.</span>
        </h1>
        <p className="text-muted mt-3 max-w-2xl">
          Enter a keyword. We pull the top products ranking for it on Amazon,
          fetch real customer reviews, and use Claude to extract the language
          driving wins, losses, and high-converting ad ideas.
        </p>
      </header>

      <section className="bg-panel border border-border rounded-xl p-6 max-w-2xl">
        <KeywordForm loading={loading} onSubmit={handleSubmit} />
      </section>

      {error && (
        <div className="mt-6 max-w-2xl bg-negative/10 border border-negative/40 rounded-lg p-4 text-negative text-sm">
          <strong className="font-semibold">Error: </strong>
          {error}
        </div>
      )}

      {loading && !result && (
        <div className="mt-10 space-y-3">
          <SkeletonRow label="Searching top products on Amazon…" />
          <SkeletonRow label="Pulling reviews for each product…" />
          <SkeletonRow label="Claude extracting sentiment themes & ad angles…" />
        </div>
      )}

      {result && <ResultsView result={result} />}

      <footer className="mt-16 pt-6 border-t border-border text-xs text-muted">
        Built with Next.js · Amazon data via RapidAPI · Analysis by Anthropic
        Claude
      </footer>
    </main>
  );
}

function SkeletonRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      {label}
    </div>
  );
}
