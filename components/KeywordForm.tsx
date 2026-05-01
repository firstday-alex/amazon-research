"use client";

import { useState } from "react";

type Props = {
  loading: boolean;
  onSubmit: (params: {
    keyword: string;
    productLimit: number;
    reviewsPerProduct: number;
    country: string;
  }) => void;
};

export function KeywordForm({ loading, onSubmit }: Props) {
  const [keyword, setKeyword] = useState("");
  const [productLimit, setProductLimit] = useState(10);
  const [reviewsPerProduct, setReviewsPerProduct] = useState(25);
  const [country, setCountry] = useState("US");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!keyword.trim() || loading) return;
        onSubmit({ keyword: keyword.trim(), productLimit, reviewsPerProduct, country });
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm text-muted mb-2">
          Amazon search keyword
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='e.g. "electrolyte powder", "ergonomic office chair"'
          className="w-full px-4 py-3 bg-panel border border-border rounded-lg text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Products</label>
          <input
            type="number"
            min={1}
            max={10}
            value={productLimit}
            onChange={(e) => setProductLimit(parseInt(e.target.value) || 10)}
            className="w-full px-3 py-2 bg-panel border border-border rounded-lg text-ink focus:outline-none focus:border-accent"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Reviews / product</label>
          <input
            type="number"
            min={5}
            max={50}
            value={reviewsPerProduct}
            onChange={(e) =>
              setReviewsPerProduct(parseInt(e.target.value) || 25)
            }
            className="w-full px-3 py-2 bg-panel border border-border rounded-lg text-ink focus:outline-none focus:border-accent"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 bg-panel border border-border rounded-lg text-ink focus:outline-none focus:border-accent"
            disabled={loading}
          >
            <option value="US">US</option>
            <option value="GB">GB</option>
            <option value="CA">CA</option>
            <option value="DE">DE</option>
            <option value="FR">FR</option>
            <option value="IT">IT</option>
            <option value="ES">ES</option>
            <option value="JP">JP</option>
            <option value="AU">AU</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !keyword.trim()}
        className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? "Analyzing… (this can take 30–90s)" : "Run analysis"}
      </button>
    </form>
  );
}
