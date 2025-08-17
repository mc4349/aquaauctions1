"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getFeaturedStreams,
  getPopularStreams,
  getStreamsByFilter,
} from "@/lib/firestore"; // new utility functions

type Stream = {
  id: string;
  channel: string;
  sellerUid: string;
  status: string;
  startedAt?: any;
  thumbnailUrl?: string;
  type?: "coral" | "fish" | "equipment";
  viewerCount?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
};

type FilterOptions = {
  type: "" | "coral" | "fish" | "equipment";
  sortBy: "viewers" | "rating" | "";
};

export default function ExplorePage() {
  const [featuredStreams, setFeaturedStreams] = useState<Stream[]>([]);
  const [popularStreams, setPopularStreams] = useState<Stream[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filter, setFilter] = useState<FilterOptions>({
    type: "",
    sortBy: "",
  });

  // Featured streams
  useEffect(() => {
    getFeaturedStreams().then(setFeaturedStreams);
  }, []);

  // Popular streams
  useEffect(() => {
    getPopularStreams().then(setPopularStreams);
  }, []);

  // Filtered streams
  useEffect(() => {
    getStreamsByFilter(filter).then(setStreams);
  }, [filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-teal-100 to-cyan-200 pb-20">
      <div className="space-y-8 max-w-3xl mx-auto pt-12">
        <h1 className="text-4xl font-black text-teal-700 drop-shadow-sm mb-2 text-center">Explore</h1>
        <p className="text-blue-900 text-center">
          Search sellers, coral, fish, and equipment. <span className="italic text-xs">(Now with filters, featured, leaderboard)</span>
        </p>

        {/* FILTERS */}
        <div className="flex gap-3 flex-wrap items-center justify-center mb-6">
          <label>Type:</label>
          <select
            value={filter.type}
            onChange={e => setFilter(f => ({ ...f, type: e.target.value as any }))}
            className="border rounded px-2 py-1"
          >
            <option value="">All</option>
            <option value="coral">Coral</option>
            <option value="fish">Fish</option>
            <option value="equipment">Equipment</option>
          </select>
          <button
            className={`px-3 py-1 rounded-xl ${filter.sortBy === "viewers" ? "bg-teal-700 text-white" : "bg-gray-200"} shadow font-bold`}
            onClick={() => setFilter(f => ({ ...f, sortBy: "viewers" }))}
          >
            Most Viewers
          </button>
          <button
            className={`px-3 py-1 rounded-xl ${filter.sortBy === "rating" ? "bg-teal-700 text-white" : "bg-gray-200"} shadow font-bold`}
            onClick={() => setFilter(f => ({ ...f, sortBy: "rating" }))}
          >
            Best Rated
          </button>
        </div>

        {/* FEATURED */}
        <h2 className="text-xl font-bold text-teal-700 mb-2">Featured Live Streams</h2>
        <ul className="space-y-4">
          {featuredStreams.length === 0 ? (
            <div className="rounded bg-yellow-100 p-6 text-yellow-900 text-center font-semibold shadow">No featured streams.</div>
          ) : (
            featuredStreams.map((s) => (
              <li key={s.id} className="border rounded-xl p-4 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-teal-700">{s.channel}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Started: {s.startedAt?.toDate?.().toLocaleString?.() ?? ""}
                  </span>
                  {s.type && (
                    <span className="ml-2 text-xs bg-cyan-200 px-2 py-1 rounded">{s.type}</span>
                  )}
                </div>
                <img
                  src={s.thumbnailUrl || "/default-thumb.jpg"}
                  alt={`Live preview of ${s.channel}`}
                  className="w-full max-w-md rounded-lg shadow my-2"
                />
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-gray-600">Viewers: {s.viewerCount ?? "?"}</span>
                  <span className="text-xs text-gray-600">Rating: {s.rating ?? "—"} ({s.reviewCount ?? 0})</span>
                </div>
                <Link
                  href={`/live/${s.channel}`}
                  className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl shadow w-fit font-bold"
                >
                  View Live Stream
                </Link>
              </li>
            ))
          )}
        </ul>

        {/* POPULAR */}
        <h2 className="text-xl font-bold text-teal-700 mb-2 mt-8">Most Popular Live Streams</h2>
        <ul className="space-y-4">
          {popularStreams.length === 0 ? (
            <div className="rounded bg-yellow-100 p-6 text-yellow-900 text-center font-semibold shadow">No popular streams.</div>
          ) : (
            popularStreams.map((s) => (
              <li key={s.id} className="border rounded-xl p-4 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg text-teal-700">{s.channel}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Started: {s.startedAt?.toDate?.().toLocaleString?.() ?? ""}
                  </span>
                  {s.type && (
                    <span className="ml-2 text-xs bg-cyan-200 px-2 py-1 rounded">{s.type}</span>
                  )}
                </div>
                <img
                  src={s.thumbnailUrl || "/default-thumb.jpg"}
                  alt={`Popular preview of ${s.channel}`}
                  className="w-full max-w-md rounded-lg shadow my-2"
                />
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-gray-600">Viewers: {s.viewerCount ?? "?"}</span>
                  <span className="text-xs text-gray-600">Rating: {s.rating ?? "—"} ({s.reviewCount ?? 0})</span>
                </div>
                <Link
                  href={`/live/${s.channel}`}
                  className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl shadow w-fit font-bold"
                >
                  View Live Stream
                </Link>
              </li>
            ))
          )}
        </ul>

        {/* FILTERED */}
        <h2 className="text-xl font-semibold mt-6 text-teal-700">All Live Streams</h2>
        {streams.length === 0 ? (
          <div className="rounded bg-yellow-100 p-6 text-yellow-900 text-center font-semibold shadow">
            No sellers are live right now.
          </div>
        ) : (
          <ul className="space-y-4">
            {streams.map((s) => (
              <li key={s.id} className="border rounded-xl p-4 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow flex flex-col gap-2">
                <div>
                  <span className="font-semibold text-lg text-teal-700">{s.channel}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Started: {s.startedAt?.toDate?.().toLocaleString?.() ?? ""}
                  </span>
                  {s.type && (
                    <span className="ml-2 text-xs bg-cyan-200 px-2 py-1 rounded">{s.type}</span>
                  )}
                </div>
                <img
                  src={s.thumbnailUrl || "/default-thumb.jpg"}
                  alt={`Preview of ${s.channel}`}
                  className="w-full max-w-md rounded-lg shadow my-2"
                />
                <div className="flex gap-4 items-center">
                  <span className="text-xs text-gray-600">Viewers: {s.viewerCount ?? "?"}</span>
                  <span className="text-xs text-gray-600">Rating: {s.rating ?? "—"} ({s.reviewCount ?? 0})</span>
                </div>
                <Link
                  href={`/live/${s.channel}`}
                  className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-xl shadow w-fit font-bold"
                >
                  View Live Stream
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* LEADERBOARD */}
        <div className="mt-12">
          <Link href="/analytics" className="block text-center">
            <span className="text-teal-700 font-bold underline text-lg">
              View Seller Leaderboard & Analytics →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}