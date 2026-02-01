"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const designs = [
  {
    name: "Modern Coastal",
    description: "Bright whites, warm woods, brass accents, linen textures."
  },
  {
    name: "Japandi Minimal",
    description: "Soft neutrals, low silhouettes, calm natural textures."
  },
  {
    name: "Industrial Loft",
    description: "Matte metals, exposed brick, bold contrasts, concrete."
  }
];

export default function Home() {
  const [listingUrl, setListingUrl] = useState("");
  const [design, setDesign] = useState(designs[0]?.name ?? "");
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const report = useMemo(
    () => ({
      address: "Listing address (auto-detected)",
      design,
      summary:
        "This tentative concept focuses on quick curb-appeal gains, a refreshed main living area, and a light kitchen uplift. Scope below prioritizes cosmetic upgrades with limited structural work.",
      budget: [
        { item: "Exterior refresh", range: "$6k–$12k" },
        { item: "Main living space", range: "$8k–$15k" },
        { item: "Kitchen update", range: "$12k–$28k" },
        { item: "Primary bathroom", range: "$10k–$22k" },
        { item: "Lighting + fixtures", range: "$3k–$7k" }
      ],
      scope: [
        "Repaint walls/trim in warm neutral palette",
        "Replace dated lighting with statement pendants",
        "Update flooring with wide-plank LVP or engineered wood",
        "Cabinet refresh + new hardware",
        "Replace bathroom vanity + mirror set",
        "Add layered textiles and staging for photos"
      ],
      assumptions: [
        "No structural or layout changes",
        "Existing plumbing locations remain",
        "Scope is cosmetic and market-ready",
        "Final pricing based on local contractor quotes"
      ]
    }),
    [design]
  );

  useEffect(() => {
    if (showReport && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showReport]);

  return (
    <main className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#38bdf8_0%,_transparent_40%),radial-gradient(circle_at_20%_40%,_#a855f7_0%,_transparent_45%),radial-gradient(circle_at_80%_20%,_#f59e0b_0%,_transparent_40%)] opacity-30" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16">
          <header className="flex flex-col gap-4">
            <span className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Contractor Vision
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Create a stunning renovation concept in minutes.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              Paste a listing URL, pick a design direction, and get a polished concept
              preview for your next project.
            </p>
          </header>

          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass rounded-3xl p-8">
              <form
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  const params = new URLSearchParams();
                  if (listingUrl) params.set("url", listingUrl);
                  if (design) params.set("design", design);
                  router.push(`/report?${params.toString()}`);
                }}
              >
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-200">
                    Listing URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.zillow.com/homedetails/..."
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
                    value={listingUrl}
                    onChange={(event) => setListingUrl(event.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-200">
                    Design direction
                  </label>
                  <select
                    className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
                    value={design}
                    onChange={(event) => setDesign(event.target.value)}
                  >
                    {designs.map((design) => (
                      <option
                        key={design.name}
                        value={design.name}
                        className="bg-slate-900 text-white"
                      >
                        {design.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Generate concept
                </button>
                {showReport && (
                  <p className="text-sm text-emerald-200">
                    Tentative report generated below.
                  </p>
                )}
              </form>

              <div className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Estimated delivery</span>
                  <span>~2 min</span>
                </div>
                <p className="text-base font-medium text-slate-100">
                  You will receive a curated report with renders, budget guidance,
                  and a shareable summary.
                </p>
              </div>
            </div>

            <div className="glass rounded-3xl p-8">
              <h2 className="text-xl font-semibold">Design palettes</h2>
              <div className="mt-6 flex flex-col gap-4">
                {designs.map((design) => (
                  <div
                    key={design.name}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <h3 className="text-lg font-semibold">{design.name}</h3>
                    <p className="mt-2 text-sm text-slate-300">{design.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {showReport && (
            <section ref={reportRef} className="overflow-hidden rounded-3xl bg-slate-50 text-slate-900 shadow-2xl">
              <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-8 py-10 text-white">
                <h2 className="text-3xl font-semibold">Contractor Vision Report</h2>
                <p className="mt-1 text-sm text-white/90">Listing URL</p>
                <p className="text-sm text-white/90">Design style: {report.design}</p>
              </div>

              <div className="mx-auto -mt-6 flex w-full max-w-5xl flex-col gap-8 px-6 pb-10">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
                  <h3 className="text-xl font-semibold">Executive Summary</h3>
                  <p className="mt-2 text-sm text-slate-600">{report.summary}</p>
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
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Room Concepts</h3>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`room-${index}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow"
                      >
                        <div className="h-40 w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
                        <div className="p-4">
                          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            Room
                          </span>
                          <p className="mt-3 text-sm text-slate-500">
                            No AI render yet. Connect Replicate to enable.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Budget Estimate</h3>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="grid grid-cols-2 gap-x-6 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <span>Scope</span>
                      <span>Range</span>
                    </div>
                    <div className="divide-y divide-slate-200 text-sm">
                      {report.budget.map((row) => (
                        <div key={row.item} className="grid grid-cols-2 gap-x-6 px-5 py-3">
                          <span>{row.item}</span>
                          <span className="font-semibold text-slate-700">{row.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="text-lg font-semibold">Scope of Work</h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-600">
                      {report.scope.map((item) => (
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
                      {report.assumptions.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <footer className="text-xs text-slate-400">
                  Tentative report generated without AI calls. Final scope and pricing are subject
                  to contractor validation.
                </footer>
              </div>
            </section>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400">
            <span>Prototype UI · Next.js</span>
            <span>Railway-ready deployment</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
