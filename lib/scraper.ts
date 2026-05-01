import type { AmazonProduct, AmazonReview } from "./types";

const HOST = process.env.RAPIDAPI_HOST || "real-time-amazon-data.p.rapidapi.com";

function requireKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error(
      "RAPIDAPI_KEY is not set. Add it to .env.local — see .env.example."
    );
  }
  return key;
}

async function rapid<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://${HOST}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      "x-rapidapi-key": requireKey(),
      "x-rapidapi-host": HOST,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RapidAPI ${path} failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

type SearchResponse = {
  data?: {
    products?: Array<{
      asin: string;
      product_title: string;
      product_price?: string;
      product_star_rating?: string;
      product_num_ratings?: number;
      product_url?: string;
      product_photo?: string;
      brand?: string;
    }>;
  };
};

export async function searchTopProducts(
  keyword: string,
  limit = 10,
  country = "US"
): Promise<AmazonProduct[]> {
  const data = await rapid<SearchResponse>("/search", {
    query: keyword,
    page: "1",
    country,
    sort_by: "RELEVANCE",
  });

  const items = data.data?.products ?? [];
  return items.slice(0, limit).map((p) => ({
    asin: p.asin,
    title: p.product_title,
    brand: p.brand,
    price: p.product_price,
    rating: p.product_star_rating ? parseFloat(p.product_star_rating) : undefined,
    ratingsTotal: p.product_num_ratings,
    imageUrl: p.product_photo,
    productUrl: p.product_url,
  }));
}

type ReviewsResponse = {
  data?: {
    reviews?: Array<{
      review_id?: string;
      review_title?: string;
      review_comment?: string;
      review_star_rating?: string;
      review_date?: string;
      is_verified_purchase?: boolean;
      helpful_vote_statement?: string;
    }>;
  };
};

function parseHelpful(s?: string): number | undefined {
  if (!s) return undefined;
  const m = s.match(/([\d,]+)/);
  if (!m) return undefined;
  return parseInt(m[1].replace(/,/g, ""), 10);
}

export async function fetchProductReviews(
  product: AmazonProduct,
  perProduct = 30,
  country = "US"
): Promise<AmazonReview[]> {
  const collected: AmazonReview[] = [];
  const pagesNeeded = Math.max(1, Math.ceil(perProduct / 10));

  for (let page = 1; page <= pagesNeeded && collected.length < perProduct; page++) {
    const data = await rapid<ReviewsResponse>("/product-reviews", {
      asin: product.asin,
      country,
      sort_by: "TOP_REVIEWS",
      verified_purchases_only: "false",
      page: String(page),
    });

    const reviews = data.data?.reviews ?? [];
    if (reviews.length === 0) break;

    for (const r of reviews) {
      const body = (r.review_comment ?? "").trim();
      if (!body) continue;
      const rating = r.review_star_rating
        ? parseFloat(r.review_star_rating)
        : NaN;
      collected.push({
        asin: product.asin,
        productTitle: product.title,
        reviewId: r.review_id,
        title: r.review_title?.trim(),
        body,
        rating: Number.isFinite(rating) ? rating : 0,
        verified: r.is_verified_purchase,
        date: r.review_date,
        helpful: parseHelpful(r.helpful_vote_statement),
      });
      if (collected.length >= perProduct) break;
    }
  }

  return collected;
}

export async function fetchAllReviews(
  products: AmazonProduct[],
  perProduct = 30,
  country = "US"
): Promise<{ reviews: AmazonReview[]; failures: string[] }> {
  const failures: string[] = [];
  const settled = await Promise.allSettled(
    products.map((p) => fetchProductReviews(p, perProduct, country))
  );

  const reviews: AmazonReview[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") {
      reviews.push(...s.value);
    } else {
      failures.push(`${products[i].asin}: ${String(s.reason).slice(0, 120)}`);
    }
  });
  return { reviews, failures };
}
