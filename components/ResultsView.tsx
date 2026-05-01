import type { AnalysisResult, SentimentTheme, AdAngle } from "@/lib/types";

function ThemeList({
  title,
  themes,
  tone,
}: {
  title: string;
  themes: SentimentTheme[];
  tone: "positive" | "negative";
}) {
  const accent = tone === "positive" ? "text-positive" : "text-negative";
  const dot = tone === "positive" ? "bg-positive" : "bg-negative";

  return (
    <div className="bg-panel border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className={`text-sm font-semibold uppercase tracking-wide ${accent}`}>
          {title}
        </h3>
        <span className="text-xs text-muted ml-auto">
          {themes.length} themes
        </span>
      </div>

      <div className="space-y-3">
        {themes.map((t, i) => (
          <div
            key={`${t.keyword}-${i}`}
            className="border-b border-border last:border-0 pb-3 last:pb-0"
          >
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="font-medium text-ink">{t.keyword}</span>
              <span className="text-xs text-muted shrink-0">
                {t.frequency} mentions · {t.productAsins.length} products
              </span>
            </div>
            {t.exampleQuotes.length > 0 && (
              <ul className="space-y-1">
                {t.exampleQuotes.slice(0, 2).map((q, j) => (
                  <li key={j} className="text-sm text-muted italic">
                    “{q}”
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdAngleCard({ angle, index }: { angle: AdAngle; index: number }) {
  return (
    <div className="bg-panel border border-border rounded-xl p-5 hover:border-accent transition-colors">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-accent text-xs font-mono">
          #{String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-xs text-muted uppercase tracking-wider">
          {angle.format}
        </span>
      </div>
      <h4 className="text-lg font-bold text-ink mb-2 leading-tight">
        {angle.headline}
      </h4>
      <p className="text-sm text-ink mb-3 leading-relaxed">{angle.hook}</p>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted text-xs uppercase tracking-wide">
            Why it works:{" "}
          </span>
          <span className="text-ink/90">{angle.rationale}</span>
        </div>
        <div className="bg-bg border-l-2 border-accent pl-3 py-1.5 italic text-muted">
          “{angle.proofPoint}”
        </div>
      </div>
    </div>
  );
}

export function ResultsView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8 mt-10">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            Insights for{" "}
            <span className="text-accent">"{result.keyword}"</span>
          </h2>
          <p className="text-sm text-muted mt-1">
            {result.productCount} products · {result.reviewCount} reviews analyzed
          </p>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="bg-panel border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-2">
            Executive Summary
          </h3>
          <p className="text-ink leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* Products */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
          Top {result.products.length} Products
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {result.products.map((p) => (
            <a
              key={p.asin}
              href={p.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-panel border border-border rounded-lg p-3 hover:border-accent transition-colors"
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-full aspect-square object-contain mb-2 bg-bg rounded"
                />
              )}
              <p className="text-xs text-ink line-clamp-2 leading-tight mb-1">
                {p.title}
              </p>
              <p className="text-xs text-muted">
                {p.rating ? `★ ${p.rating}` : ""}
                {p.ratingsTotal ? ` · ${p.ratingsTotal.toLocaleString()}` : ""}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Themes */}
      <div className="grid md:grid-cols-2 gap-5">
        <ThemeList
          title="Positive sentiment drivers"
          themes={result.positiveThemes}
          tone="positive"
        />
        <ThemeList
          title="Negative sentiment drivers"
          themes={result.negativeThemes}
          tone="negative"
        />
      </div>

      {/* Ad angles */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-4">
          5 Creative Ad Angles
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {result.adAngles.map((a, i) => (
            <AdAngleCard key={i} angle={a} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
