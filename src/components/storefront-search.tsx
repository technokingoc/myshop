"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  Star,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface SearchFilters {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sort: string;
}

interface SearchData {
  products: any[];
  categories: string[];
  priceRange: { minPrice: number; maxPrice: number };
  pagination: { total: number; hasMore: boolean };
}

interface StorefrontSearchProps {
  storeSlug: string;
  onResults: (data: SearchData) => void;
  onLoading: (loading: boolean) => void;
  currency: string;
  globalCategories: { slug: string; label: string }[];
  t: Record<string, string>;
}

export function StorefrontSearch({
  storeSlug,
  onResults,
  onLoading,
  currency,
  globalCategories,
  t,
}: StorefrontSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    sort: "recent",
  });
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [error, setError] = useState<string | null>(null);

  // Search function
  const search = useCallback(async (searchFilters: SearchFilters, offset = 0) => {
    onLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (offset > 0) params.set("offset", offset.toString());

      const response = await fetch(`/api/storefront/${storeSlug}/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        onResults(data);
        
        // Update price range from API response
        if (data.priceRange) {
          setPriceRange({ 
            min: data.priceRange.minPrice || 0, 
            max: data.priceRange.maxPrice || 1000 
          });
        }
      } else {
        setError("Failed to search. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Search temporarily unavailable. Please try again.");
    } finally {
      onLoading(false);
    }
  }, [storeSlug, onResults, onLoading]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, search]);

  // Generate search suggestions based on query
  const generateSuggestions = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    // Simple suggestions - in a real app, this could be from an API
    const commonSuggestions = [
      query,
      `${query} deals`,
      `best ${query}`,
      `cheap ${query}`,
      `new ${query}`,
    ];
    
    return commonSuggestions.slice(0, 5);
  }, []);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({
      q: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      sort: "recent",
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.q || filters.category || filters.minPrice || filters.maxPrice || 
           filters.minRating || filters.sort !== "recent";
  }, [filters]);

  const handleSearchInput = (value: string) => {
    updateFilter("q", value);
    if (value) {
      setSuggestions(generateSuggestions(value));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const sortOptions = [
    { value: "recent", label: t.sortRecent || "Recent" },
    { value: "price_asc", label: t.sortPriceAsc || "Price: Low to High" },
    { value: "price_desc", label: t.sortPriceDesc || "Price: High to Low" },
    { value: "rating", label: t.sortRating || "Highest Rated" },
    { value: "popular", label: t.sortPopular || "Most Popular" },
  ];

  const ratingOptions = [
    { value: "", label: t.allRatings || "All ratings" },
    { value: "4", label: "4+ ★" },
    { value: "3", label: "3+ ★" },
    { value: "2", label: "2+ ★" },
  ];

  return (
    <>
      {/* Desktop Search Bar */}
      <div className="space-y-4">
        {/* Main search input */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400 z-10" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder={t.searchProducts || "Search products..."}
              className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              onFocus={() => filters.q && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {filters.q && (
              <button
                onClick={() => {
                  updateFilter("q", "");
                  setShowSuggestions(false);
                }}
                className="absolute right-4 h-5 w-5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    updateFilter("q", suggestion);
                    setShowSuggestions(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Filters */}
        <div className="hidden lg:flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">{t.allCategories || "All categories"}</option>
            {globalCategories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder={t.minPrice || "Min price"}
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder={t.maxPrice || "Max price"}
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.minRating}
            onChange={(e) => updateFilter("minRating", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              {t.clearFilters || "Clear"}
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t.filters || "Filters"}
            {hasActiveFilters && (
              <span className="rounded-full bg-indigo-600 h-2 w-2"></span>
            )}
          </button>

          {/* Mobile Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowMobileFilters(false)} />
          <div className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {t.filters || "Filters"}
              </h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.category || "Category"}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">{t.allCategories || "All categories"}</option>
                  {globalCategories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.priceRange || "Price Range"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t.minPrice || "Min"}
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder={t.maxPrice || "Max"}
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                {priceRange.min !== priceRange.max && (
                  <p className="text-xs text-slate-500 mt-1">
                    {currency} {priceRange.min} - {currency} {priceRange.max}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.rating || "Rating"}
                </label>
                <select
                  value={filters.minRating}
                  onChange={(e) => updateFilter("minRating", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {ratingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={clearFilters}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {t.clearFilters || "Clear all"}
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {t.applyFilters || "Apply filters"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}