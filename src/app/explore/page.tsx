"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getFeaturedStreams,
  getPopularStreams,
  getStreamsByFilter,
} from "@/lib/firestore";

type Stream = {
  id: string;
  channel: string;
  sellerUid: string;
  status: string;
  startedAt?: any;
  thumbnailUrl?: string;
  type?: "" | "coral" | "fish" | "equipment";
  viewerCount?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
};

type FilterOptions = {
  type: "" | "coral" | "fish" | "equipment";
  sortBy: "viewers" | "rating" | "";
};

const FILTERS = [
  { type: "", icon: "🌴", label: "All" },
  { type: "coral", icon: "🪸", label: "Coral" },
  { type: "fish", icon: "🐟", label: "Fish" },
  { type: "equipment", icon: "⚙️", label: "Equipment" },
];

export default function ExplorePage() {
  const [featuredStreams, setFeaturedStreams] = useState<Stream[]>([]);
  const [popularStreams, setPopularStreams] = useState<Stream[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({
    type: "",
    sortBy: "",
  });

  useEffect(() => {
    getFeaturedStreams().then(setFeaturedStreams);
  }, []);

  useEffect(() => {
    getPopularStreams().then(setPopularStreams);
  }, []);

  useEffect(() => {
    getStreamsByFilter(filter).then(setStreams);
  }, [filter]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white pb-24">
      <div className="max-w-md mx-auto pt-8">
        <h1 className="text-3xl font-black mb-2 text-center text-white drop-shadow">Explore</h1>
        <p className="text-neutral-400 text-center mb-4 text-sm">
          Search sellers, coral, fish, and equipment.
        </p>

        {/* Search bar */}
        <div className="mb-4 px-2">
          <input
            className="w-full rounded-full bg-neutral-800 text-white placeholder:text-neutral-400 px-4 py-2 border-none outline-none"
            placeholder="Search live streams..."
          />
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f.type}
              onClick={() =>
                setFilter(x => ({
                  ...x,
                  type: f.type as "" | "coral" | "fish" | "equipment",
                }))
              }
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter.type === f.type
                  ? "bg-white text-neutral-900 shadow"
                  : "bg-neutral-800 text-white"
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
          {/* Sort */}
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter.sortBy === "viewers"
                ? "bg-white text-neutral-900 shadow"
                : "bg-neutral-800 text-white"
            }`}
            onClick={() =>
              setFilter(f => ({
                ...f,
                sortBy: "viewers" as "viewers" | "rating" | "",
              }))
            }
          >
            👀 Most Viewers
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              filter.sortBy === "rating"
                ? "bg-white text-neutral-900 shadow"
                : "bg-neutral-800 text-white"
            }`}
            onClick={() =>
              setFilter(f => ({
                ...f,
                sortBy: "rating" as "viewers" | "rating" | "",
              }))
            }
          >
            ⭐ Best Rated
          </button>
        </div>

        {/* FEATURED */}
        <h2 className="text-lg font-bold text-white mb-2">Featured Live Streams</h2>
        <div className="grid grid-cols-1 gap-4">
          {featuredStreams.length === 0 ? (
            <div className="rounded-xl bg-yellow-200/50 p-6 text-yellow-900 text-center font-semibold shadow">No featured streams.</div>
          ) : (
            featuredStreams.map((s) => (
              <div key={s.id} className="bg-neutral-800 rounded-2xl overflow-hidden shadow-md flex flex-col">
                <div className="relative">
                  <img
                    src={s.thumbnailUrl || "/default-thumb.jpg"}
                    alt={`Live preview of ${s.channel}`}
                    className="w-full h-40 object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-xs px-2 py-1 rounded font-bold">LIVE</span>
                  <span className="absolute top-2 right-2 bg-neutral-700 px-2 py-1 rounded text-xs flex items-center gap-1">👀 {s.viewerCount ?? "?"}</span>
                </div>
                <div className="p-3">
                  <div className="font-bold">{s.channel}</div>
                  <div className="text-xs text-neutral-400">
                    Started: {s.startedAt?.toDate?.()?.toLocaleString?.() ?? ""}
                  </div>
                  <div className="mt-2 text-xs">{s.type && <span className="bg-neutral-700 px-2 py-1 rounded">{s.type}</span>}</div>
                  <div className="mt-2 text-xs text-neutral-400">Rating: {s.rating ?? "—"} ({s.reviewCount ?? 0})</div>
                  <Link
                    href={`/live/${s.channel}`}
                    className="mt-3 px-4 py-2 bg-lime-400 font-bold text-neutral-900 rounded-xl shadow w-fit"
                  >
                    View Live Stream
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* POPULAR */}
        <h2 className="text-lg font-bold text-white mb-2 mt-8">Most Popular Live Streams</h2>
        <div className="grid grid-cols-1 gap-4">
          {popularStreams.length === 0 ? (
            <div className="rounded-xl bg-yellow-200/50 p-6 text-yellow-900 text-center font-semibold shadow">No popular streams.</div>
          ) : (
            popularStreams.map((s) => (
              <div key={s.id} className="bg-neutral-800 rounded-2xl overflow-hidden shadow-md flex flex-col">
                <div className="relative">
                  <img
                    src={s.thumbnailUrl || "/default-thumb.jpg"}
                    alt={`Popular preview of ${s.channel}`}
                    className="w-full h-40 object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-xs px-2 py-1 rounded font-bold">LIVE</span>
                  <span className="absolute top-2 right-2 bg-neutral-700 px-2 py-1 rounded text-xs flex items-center gap-1">👀 {s.viewerCount ?? "?"}</span>
                </div>
                <div className="p-3">
                  <div className="font-bold">{s.channel}</div>
                  <div className="text-xs text-neutral-400">
                    Started: {s.startedAt?.toDate?.()?.toLocaleString?.() ?? ""}
                  </div>
                  <div className="mt-2 text-xs">{s.type && <span className="bg-neutral-700 px-2 py-1 rounded">{s.type}</span>}</div>
                  <div className="mt-2 text-xs text-neutral-400">Rating: {s.rating ?? "—"} ({s.reviewCount ?? 0})</div>
                  <Link
                    href={`/live/${s.channel}`}
                    className="mt-3 px-4 py-2 bg-lime-400 font-bold text-neutral-900 rounded-xl shadow w-fit"
                  >
                    View Live Stream
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FILTERED */}
        <h2 className="text-lg font-semibold mt-6 text-white">All Live Streams</h2>
        {streams.length === 0 ? (
          <div className="rounded-xl bg-yellow-200/50 p-6 text-yellow-900 text-center font-semibold shadow">
            No sellers are live right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {streams.map((s) => (
              <div key={s.id} className="bg-neutral-800 rounded-2xl overflow-hidden shadow-md flex flex-col">
                <div className="relative">
                  <img
                    src={s.thumbnailUrl || "/default-thumb.jpg"}
                    alt={`Preview of ${s.channel}`}
                    className="w-full h-40 object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-xs px-2 py-1 rounded font-bold">LIVE</span>
                  <span className="absolute top-2 right-2 bg-neutral-700 px-2 py-1 rounded text-xs flex items-center gap-1">👀 {s.viewerCount ?? "?"}</span>
                </div>
                <div className="p-3">
                  <div className="font-bold">{s.channel}</div>
                  <div className="text-xs text-neutral-400">
                    Started: {s.startedAt?.toDate?.()?.toLocaleString?.() ?? ""}
                  </div>
                  <div className="mt-2 text-xs">{s.type && <span className="bg-neutral-700 px-2 py-1 rounded">{s.type}</span>}</div>
                  <div className="mt-2 text-xs text-neutral-400">Rating: {s.rating ?? "—"} ({s.reviewCount ?? 0})</div>
                  <Link
                    href={`/live/${s.channel}`}
                    className="mt-3 px-4 py-2 bg-lime-400 font-bold text-neutral-900 rounded-xl shadow w-fit"
                  >
                    View Live Stream
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD LINK */}
        <div className="mt-12 mb-4">
          <Link href="/analytics" className="block text-center">
            <span className="text-lime-400 font-bold underline text-lg">
              View Seller Leaderboard & Analytics →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}