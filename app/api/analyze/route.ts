import { NextResponse } from "next/server";
import { z } from "zod";
import { searchTopProducts, fetchAllReviews } from "@/lib/scraper";
import { analyzeReviews } from "@/lib/analyzer";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const Body = z.object({
  keyword: z.string().trim().min(2).max(120),
  productLimit: z.number().int().min(1).max(10).optional().default(10),
  reviewsPerProduct: z.number().int().min(5).max(50).optional().default(25),
  country: z.string().length(2).optional().default("US"),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", detail: String(err) },
      { status: 400 }
    );
  }

  const { keyword, productLimit, reviewsPerProduct, country } = parsed;

  try {
    const products = await searchTopProducts(keyword, productLimit, country);
    if (products.length === 0) {
      return NextResponse.json(
        { error: `No products found on Amazon for "${keyword}"` },
        { status: 404 }
      );
    }

    const { reviews, failures } = await fetchAllReviews(
      products,
      reviewsPerProduct,
      country
    );

    if (reviews.length === 0) {
      return NextResponse.json(
        {
          error: "No reviews could be fetched",
          detail: failures.join("; "),
        },
        { status: 502 }
      );
    }

    const analysis = await analyzeReviews(keyword, products, reviews);

    const result: AnalysisResult = {
      keyword,
      productCount: products.length,
      reviewCount: reviews.length,
      products,
      ...analysis,
    };

    return NextResponse.json({ ...result, scrapeFailures: failures });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
