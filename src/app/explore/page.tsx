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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Explore</h1>
      <p>Search sellers, coral, fish, and equipment. (Coming next)</p>
      <h2 className="text-xl font-semibold mt-4">Live Streams</h2>
      {streams.length === 0 ? (
        <p className="text-gray-500">No sellers are live right now.</p>
      ) : (
        <ul className="space-y-2">
          {streams.map((s) => (
            <li key={s.id} className="border rounded p-2 flex flex-col">
              <div>
                <span className="font-semibold">{s.channel}</span>
                <span className="text-xs text-gray-500 ml-2">
                  Started: {s.startedAt?.toDate?.().toLocaleString?.() ?? ""}
                </span>
              </div>
              <Link
                href={`/live/${s.channel}`}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded w-fit"
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