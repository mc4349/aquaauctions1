"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

type Stream = {
  id: string;
  channel: string;
  sellerUid: string;
  status: string;
  startedAt?: any;
  thumbnailUrl?: string;
};

export default function ExplorePage() {
  const [streams, setStreams] = useState<Stream[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "livestreams"),
      where("status", "==", "live")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Stream[] = [];
      snap.forEach((d: any) => {
        const data = d.data();
        list.push({
          id: d.id,
          channel: data.channel,
          sellerUid: data.sellerUid,
          status: data.status,
          startedAt: data.startedAt,
          thumbnailUrl: data.thumbnailUrl, // add thumbnail support
        });
      });
      setStreams(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-teal-100 to-cyan-200 pb-20">
      <div className="space-y-8 max-w-2xl mx-auto pt-12">
        <h1 className="text-4xl font-black text-teal-700 drop-shadow-sm mb-2 text-center">Explore</h1>
        <p className="text-blue-900 text-center">Search sellers, coral, fish, and equipment. <span className="italic text-xs">(Coming next)</span></p>
        <h2 className="text-xl font-semibold mt-6 text-teal-700">Live Streams</h2>
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
                </div>
                {/* Live preview thumbnail */}
                {s.thumbnailUrl && (
                  <img
                    src={s.thumbnailUrl}
                    alt={`Live preview of ${s.channel}`}
                    className="w-full max-w-md rounded-lg shadow my-2"
                  />
                )}
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
      </div>
    </div>
  );
}