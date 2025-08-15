"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
// ⬇️ Types only at the top
import type {
  IAgoraRTCClient,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";

import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ActiveView = {
  id: string | null;
  name?: string;
  highestBid?: number;
  endsAt?: number | null;
};

export default function LiveViewerPage() {
  const params = useParams<{ channel: string }>();
  const channel = Array.isArray(params.channel) ? params.channel[0] : params.channel;
  const videoRef = useRef<HTMLDivElement | null>(null);
  const agoraRef = useRef<any>(null);

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [active, setActive] = useState<ActiveView>({ id: null });
  const [remaining, setRemaining] = useState<number>(0);

  // Join and render remote stream with dynamic import
  useEffect(() => {
    let mounted = true;

    (async () => {
      const Agora = await import("agora-rtc-sdk-ng");
      if (!mounted) return;
      agoraRef.current = Agora.default;

      const c = Agora.default.createClient({ mode: "rtc", codec: "vp8" });
      setClient(c);

      c.on("user-published", async (user: any, mediaType: "video" | "audio") => {
        await c.subscribe(user, mediaType);
        if (mediaType === "video") {
          const track = user.videoTrack as IRemoteVideoTrack | null;
          if (track && videoRef.current) {
            const container = document.createElement("div");
            container.style.width = "100%";
            container.style.maxWidth = "900px";
            container.style.aspectRatio = "16/9";
            container.style.borderRadius = "12px";
            container.style.overflow = "hidden";
            videoRef.current.innerHTML = "";
            videoRef.current.appendChild(container);
            track.play(container);
          }
        }
        if (mediaType === "audio") {
          const aTrack = user.audioTrack as IRemoteAudioTrack | null;
          aTrack?.play();
        }
      });

      c.on("user-unpublished", () => {
        if (videoRef.current) videoRef.current.innerHTML = "";
      });

      const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
      await c.join(APP_ID, channel, null, null);
    })();

    return () => {
      mounted = false;
      (async () => {
        try {
          if (client) await client.leave();
        } catch {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // Watch currentItemId and the active item doc
  useEffect(() => {
    const streamRef = doc(db, `livestreams/${channel}`);
    const unsub = onSnapshot(streamRef, async (snap) => {
      const data = snap.data() as any;
      const itemId = data?.currentItemId ?? null;
      if (!itemId) { setActive({ id: null }); return; }

      const itemRef = doc(db, `livestreams/${channel}/items/${itemId}`);
      const itemSnap = await getDoc(itemRef);
      const it = itemSnap.data() as any;
      setActive({ id: itemId, name: it?.name, highestBid: it?.highestBid, endsAt: it?.endsAt ?? null });
    });
    return () => unsub();
  }, [channel]);

  // Countdown from endsAt
  useEffect(() => {
    const id = setInterval(() => {
      if (!active?.endsAt) { setRemaining(0); return; }
      const ms = Math.max(0, active.endsAt - Date.now());
      setRemaining(Math.ceil(ms / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [active?.endsAt]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live: {channel}</h1>
      <div ref={videoRef} className="w-full flex justify-center bg-gray-50 rounded-lg py-2" />

      {active.id ? (
        <div className="rounded-lg border p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">{active.name ?? "Active Item"}</div>
            <div className="text-sm text-gray-600">Highest bid: ${active.highestBid ?? 0}</div>
          </div>
          <div className="text-xl font-bold tabular-nums">
            {remaining}s
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No active item yet.</p>
      )}

      <p className="text-sm text-gray-500">
        Timer is synced from the seller’s activation (endsAt in Firestore). Bidding comes next.
      </p>
    </div>
  );
}
