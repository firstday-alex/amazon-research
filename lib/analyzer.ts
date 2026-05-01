import Anthropic from "@anthropic-ai/sdk";
import type {
  AdAngle,
  AmazonReview,
  AnalysisResult,
  AmazonProduct,
  SentimentTheme,
} from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local — see .env.example."
    );
  }
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a senior consumer-insights analyst and direct-response copywriter.

You will be given a batch of Amazon product reviews collected from the top-ranking products for a search keyword. Your job:

1. Identify the most distinctive THEMES driving NEGATIVE sentiment (ratings 1–2 plus negative-toned 3-star). Each theme should be a short keyword/phrase (2–4 words) that captures a specific complaint pattern — not vague terms like "bad" or "good". Examples of good themes: "battery dies fast", "stitching falls apart", "smaller than pictured", "smells chemical".

2. Identify the most distinctive THEMES driving VERY POSITIVE sentiment (4–5 star reviews with enthusiastic language). Same rules — short, specific phrases that name what customers love. Examples: "fits perfectly", "lasts all day", "cools the room fast".

3. For EACH theme:
   - Count how many distinct reviews mention it (frequency).
   - Pull 1–3 short verbatim example quotes (max ~25 words each, exact wording from reviews).
   - List the ASINs of products where it appears.

4. Generate exactly 5 CREATIVE AD ANGLES that a DTC/Amazon brand could run to win in this category. Each angle should weaponize a positive theme OR exploit a competitor weakness (negative theme). Each angle includes:
   - headline: a punchy 4–10 word ad headline
   - hook: the opening line/visual concept (1–2 sentences)
   - rationale: which theme(s) it leverages and why it'll convert
   - proofPoint: a real customer-language phrase (paraphrased from reviews) that anchors trust
   - format: suggested format (e.g., "TikTok UGC", "Meta static carousel", "YouTube pre-roll", "Amazon Sponsored Brand video")

Return STRICT JSON only — no prose, no markdown fences. Schema:

{
  "summary": "2–3 sentence executive summary of what's driving wins and losses in this category",
  "positiveThemes": [
    { "keyword": "...", "frequency": <int>, "exampleQuotes": ["..."], "productAsins": ["..."] }
  ],
  "negativeThemes": [
    { "keyword": "...", "frequency": <int>, "exampleQuotes": ["..."], "productAsins": ["..."] }
  ],
  "adAngles": [
    { "headline": "...", "hook": "...", "rationale": "...", "proofPoint": "...", "format": "..." }
  ]
}

Aim for 6–10 themes per side (positive/negative). Order each list by frequency descending.`;

function buildUserPrompt(
  keyword: string,
  products: AmazonProduct[],
  reviews: AmazonReview[]
): string {
  const productList = products
    .map(
      (p, i) =>
        `${i + 1}. ASIN ${p.asin} — ${p.title}${
          p.rating ? ` (★${p.rating}, ${p.ratingsTotal ?? "?"} ratings)` : ""
        }`
    )
    .join("\n");

  const reviewBlocks = reviews
    .map((r) => {
      const head = `[ASIN ${r.asin}] ★${r.rating}${
        r.verified ? " ✓verified" : ""
      }${r.title ? ` — "${r.title}"` : ""}`;
      const body = r.body.replace(/\s+/g, " ").trim().slice(0, 800);
      return `${head}\n${body}`;
    })
    .join("\n\n---\n\n");

  return `SEARCH KEYWORD: "${keyword}"

TOP ${products.length} PRODUCTS RANKING FOR THIS KEYWORD:
${productList}

REVIEWS (${reviews.length} total):

${reviewBlocks}

Now produce the JSON analysis per the schema in the system prompt.`;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

type AnalysisJson = {
  summary: string;
  positiveThemes: SentimentTheme[];
  negativeThemes: SentimentTheme[];
  adAngles: AdAngle[];
};

export async function analyzeReviews(
  keyword: string,
  products: AmazonProduct[],
  reviews: AmazonReview[]
): Promise<Omit<AnalysisResult, "products" | "keyword" | "productCount" | "reviewCount">> {
  if (reviews.length === 0) {
    throw new Error("No reviews to analyze");
  }

  const anthropic = client();
  const userPrompt = buildUserPrompt(keyword, products, reviews);

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = extractJson(text) as AnalysisJson;

  return {
    summary: parsed.summary ?? "",
    positiveThemes: parsed.positiveThemes ?? [],
    negativeThemes: parsed.negativeThemes ?? [],
    adAngles: parsed.adAngles ?? [],
  };
}
