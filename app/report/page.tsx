"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const defaultDesign = "Modern Coastal";

const budget = [
  { item: "Exterior refresh", range: "$6k–$12k" },
  { item: "Main living space", range: "$8k–$15k" },
  { item: "Kitchen update", range: "$12k–$28k" },
  { item: "Primary bathroom", range: "$10k–$22k" },
  { item: "Lighting + fixtures", range: "$3k–$7k" }
];

const scope = [
  "Repaint walls/trim in warm neutral palette",
  "Replace dated lighting with statement pendants",
  "Update flooring with wide-plank LVP or engineered wood",
  "Cabinet refresh + new hardware",
  "Replace bathroom vanity + mirror set",
  "Add layered textiles and staging for photos"
];

const assumptions = [
  "No structural or layout changes",
  "Existing plumbing locations remain",
  "Scope is cosmetic and market-ready",
  "Final pricing based on local contractor quotes"
];

const tagOptions = [
  "Unassigned",
  "Living room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Office",
  "Dining",
  "Exterior",
  "Other"
];

export default function ReportPage() {
  const searchParams = useSearchParams();
  const listingUrl = searchParams.get("url") ?? "";
  const design = searchParams.get("design") ?? defaultDesign;
  const [images, setImages] = useState<Array<{ url: string; title?: string }>>(
    []
  );
  const [imageTags, setImageTags] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeUrl = useMemo(() => listingUrl.trim(), [listingUrl]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!safeUrl) {
        setImages([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/listing-images?url=${encodeURIComponent(safeUrl)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to fetch images.");
        }

        const nextImages = Array.isArray(data.images) ? data.images : [];
        const normalized = nextImages
          .map((item: { url?: string; title?: string } | string) => {
            if (typeof item === "string") return { url: item };
            return item.url ? { url: item.url, title: item.title } : null;
          })
          .filter(Boolean) as Array<{ url: string; title?: string }>;

        setImages(normalized);
        setImageTags((prev) => {
          const updated = { ...prev };
          normalized.forEach((item) => {
            if (!updated[item.url]) {
              updated[item.url] = item.title ?? "Unassigned";
            }
          });
          return updated;
        });
      } catch (err) {
        setImages([]);
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [safeUrl]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-8 py-10 text-white">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">Contractor Vision Report</h1>
            <p className="mt-1 text-sm text-white/90">Listing URL</p>
            <p className="text-sm text-white/90">Design style: {design}</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/90 hover:bg-white/10"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="mx-auto -mt-6 flex w-full max-w-5xl flex-col gap-8 px-6 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Executive Summary</h2>
          <p className="mt-2 text-sm text-slate-600">
            Generated concept renders for a {design} style. Scope below prioritizes
            cosmetic upgrades with limited structural work.
          </p>
          <div className="mt-4 text-sm text-slate-500">
            Source:{" "}
            {listingUrl ? (
              <a
                href={listingUrl}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {listingUrl}
              </a>
            ) : (
              <span>No listing URL provided.</span>
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Original Listing Images</h2>
            {loading && (
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Fetching images…
              </span>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-rose-500">{error}</p>
          )}
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(images.length
              ? images
              : Array.from({ length: 6 }, () => ({ url: "" }))).map(
              (item, index) => (
                <div
                  key={`room-${index}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow"
                >
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={`Original room ${index + 1}`}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
                  )}
                  <div className="p-4">
                    <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      Original
                    </span>
                    <p className="mt-3 text-sm text-slate-500">
                      {images.length
                        ? "No AI render yet. Connect Replicate to enable."
                        : "Paste a listing URL to load images."}
                    </p>
                    {item.url && (
                      <div className="mt-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Tag
                        </label>
                        <select
                          className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
                          value={imageTags[item.url] ?? "Unassigned"}
                          onChange={(event) =>
                            setImageTags((prev) => ({
                              ...prev,
                              [item.url]: event.target.value
                            }))
                          }
                        >
                          {tagOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Budget Estimate</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-2 gap-x-6 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <span>Scope</span>
              <span>Range</span>
            </div>
            <div className="divide-y divide-slate-200 text-sm">
              {budget.map((row) => (
                <div key={row.item} className="grid grid-cols-2 gap-x-6 px-5 py-3">
                  <span>{row.item}</span>
                  <span className="font-semibold text-slate-700">{row.range}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">Scope of Work</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {scope.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold">Assumptions</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {assumptions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="text-xs text-slate-400">
          Tentative report generated without AI calls. Final scope and pricing are subject to
          contractor validation.
        </footer>
      </div>
    </main>
  );
}
