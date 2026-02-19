"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { ChevronDown, Search, X, MapPin } from "lucide-react";

export type LocationOption = {
  id: number;
  nameEn: string;
  namePt: string;
  slug: string;
  country: string | null;
};

let cachedLocations: LocationOption[] | null = null;

export function useLocations() {
  const [locations, setLocations] = useState<LocationOption[]>(cachedLocations || []);
  const [loading, setLoading] = useState(!cachedLocations);

  useEffect(() => {
    if (cachedLocations) return;
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cachedLocations = data;
          setLocations(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { locations, loading };
}

interface LocationSelectProps {
  value: string; // slug or free-text
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowFreeText?: boolean;
}

export function LocationSelect({ value, onChange, placeholder, className, allowFreeText }: LocationSelectProps) {
  const { lang } = useLanguage();
  const { locations, loading } = useLocations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const getName = useCallback((loc: LocationOption) => (lang === "pt" ? loc.namePt : loc.nameEn), [lang]);

  const displayLabel = useMemo(() => {
    if (!value) return "";
    const match = locations.find((l) => l.slug === value || getName(l) === value);
    if (match) return getName(match);
    return value; // free-text fallback
  }, [value, locations, getName]);

  // Group by country
  const grouped = useMemo(() => {
    const countries = new Map<string, LocationOption[]>();
    const q = search.toLowerCase();
    for (const loc of locations) {
      const name = getName(loc);
      if (q && !name.toLowerCase().includes(q)) continue;
      const country = loc.country || "Other";
      if (!countries.has(country)) countries.set(country, []);
      countries.get(country)!.push(loc);
    }
    return countries;
  }, [locations, search, getName]);

  const hasMultipleCountries = grouped.size > 1;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm text-left hover:border-slate-400 transition"
      >
        <span className={`flex items-center gap-1.5 ${displayLabel ? "text-slate-900" : "text-slate-400"}`}>
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {displayLabel || placeholder || (lang === "pt" ? "Selecionar cidade" : "Select city")}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "pt" ? "Pesquisar..." : "Search..."}
              className="w-full text-sm outline-none bg-transparent"
            />
            {value && (
              <button onClick={() => { onChange(""); setOpen(false); }} className="shrink-0 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {loading && <p className="px-3 py-2 text-xs text-slate-400">{lang === "pt" ? "A carregar..." : "Loading..."}</p>}
            {!loading && grouped.size === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">{lang === "pt" ? "Nenhuma localização" : "No locations"}</p>
            )}
            {Array.from(grouped.entries()).map(([country, locs]) => (
              <div key={country}>
                {hasMultipleCountries && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{country}</p>
                )}
                {locs.map((loc) => {
                  const name = getName(loc);
                  const isSelected = value === loc.slug || value === name;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => { onChange(loc.slug); setOpen(false); setSearch(""); }}
                      className={`flex w-full items-center rounded-lg px-3 py-2 text-sm text-left transition hover:bg-slate-50 ${
                        isSelected ? "bg-green-50 text-green-700 font-medium" : "text-slate-700"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
