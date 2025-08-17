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
};

export default function ExplorePage() {
  const [streams, setStreams] = useState<Stream[]>([]);

  useEffect(() => {
    // Listen for all "live" streams
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
        });
      });
      setStreams(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Explore</h1>
      <p className="text-gray-600">Search sellers, coral, fish, and equipment. <span className="italic text-xs">(Coming next)</span></p>
      <h2 className="text-xl font-semibold mt-6">Live Streams</h2>
      {streams.length === 0 ? (
        <div className="rounded bg-yellow-50 p-4 text-yellow-700">No sellers are live right now.</div>
      ) : (
        <ul className="space-y-4">
          {streams.map((s) => (
            <li key={s.id} className="border rounded-lg p-4 bg-white shadow flex flex-col gap-2">
              <div>
                <span className="font-semibold text-lg">{s.channel}</span>
                <span className="text-xs text-gray-500 ml-2">
                  Started: {s.startedAt?.toDate?.().toLocaleString?.() ?? ""}
                </span>
              </div>
              <Link
                href={`/live/${s.channel}`}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded shadow w-fit"
              >
                View Live Stream
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}