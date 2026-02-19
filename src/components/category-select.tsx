"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useLanguage } from "@/lib/language";
import { ChevronDown, Search, X } from "lucide-react";

export type CategoryOption = {
  id: number;
  nameEn: string;
  namePt: string;
  slug: string;
  icon: string | null;
  parentId: number | null;
  children?: CategoryOption[];
};

let cachedCategories: CategoryOption[] | null = null;

export function useCategories() {
  const [categories, setCategories] = useState<CategoryOption[]>(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    if (cachedCategories) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          cachedCategories = data;
          setCategories(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}

/** Flatten categories into "Parent > Child" display format */
export function flattenCategories(tree: CategoryOption[], lang: "en" | "pt"): { id: number; slug: string; label: string; parentLabel?: string }[] {
  const result: { id: number; slug: string; label: string; parentLabel?: string }[] = [];
  for (const parent of tree) {
    const parentName = lang === "pt" ? parent.namePt : parent.nameEn;
    result.push({ id: parent.id, slug: parent.slug, label: parentName });
    if (parent.children) {
      for (const child of parent.children) {
        const childName = lang === "pt" ? child.namePt : child.nameEn;
        result.push({ id: child.id, slug: child.slug, label: `${parentName} > ${childName}`, parentLabel: parentName });
      }
    }
  }
  return result;
}

interface CategorySelectProps {
  value: string; // category slug or free-text
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategorySelect({ value, onChange, placeholder, className }: CategorySelectProps) {
  const { lang } = useLanguage();
  const { categories, loading } = useCategories();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const flat = useMemo(() => flattenCategories(categories, lang), [categories, lang]);

  // Find display label for current value
  const displayLabel = useMemo(() => {
    if (!value) return "";
    const match = flat.find((c) => c.slug === value);
    if (match) return match.label;
    return value; // free-text fallback
  }, [value, flat]);

  const filtered = useMemo(() => {
    if (!search) return flat;
    const q = search.toLowerCase();
    return flat.filter((c) => c.label.toLowerCase().includes(q));
  }, [flat, search]);

  // Close on outside click
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
        <span className={displayLabel ? "text-slate-900" : "text-slate-400"}>
          {displayLabel || placeholder || (lang === "pt" ? "Selecionar categoria" : "Select category")}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Search */}
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
          {/* Options */}
          <div className="max-h-56 overflow-y-auto p-1">
            {loading && <p className="px-3 py-2 text-xs text-slate-400">{lang === "pt" ? "A carregar..." : "Loading..."}</p>}
            {!loading && filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">{lang === "pt" ? "Nenhuma categoria" : "No categories"}</p>
            )}
            {filtered.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { onChange(cat.slug); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm text-left transition hover:bg-slate-50 ${
                  value === cat.slug ? "bg-green-50 text-green-700 font-medium" : "text-slate-700"
                }`}
              >
                {cat.parentLabel && <span className="text-slate-400 mr-1">{cat.parentLabel} &gt; </span>}
                {cat.parentLabel ? cat.label.split(" > ").pop() : cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
