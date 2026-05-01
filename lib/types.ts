export type AmazonProduct = {
  asin: string;
  title: string;
  brand?: string;
  price?: string;
  rating?: number;
  ratingsTotal?: number;
  imageUrl?: string;
  productUrl?: string;
};

export type AmazonReview = {
  asin: string;
  productTitle: string;
  reviewId?: string;
  title?: string;
  body: string;
  rating: number;
  verified?: boolean;
  date?: string;
  helpful?: number;
};

export type SentimentTheme = {
  keyword: string;
  frequency: number;
  exampleQuotes: string[];
  productAsins: string[];
};

export type AdAngle = {
  headline: string;
  hook: string;
  rationale: string;
  proofPoint: string;
  format: string;
};

export type AnalysisResult = {
  keyword: string;
  productCount: number;
  reviewCount: number;
  positiveThemes: SentimentTheme[];
  negativeThemes: SentimentTheme[];
  adAngles: AdAngle[];
  summary: string;
  products: AmazonProduct[];
};
