"use client";

import { useState } from "react";
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
  const router = useRouter();

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

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400">
            <span>Prototype UI · Next.js</span>
            <span>Railway-ready deployment</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
