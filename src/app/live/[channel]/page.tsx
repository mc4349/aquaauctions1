"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type {
  IAgoraRTCClient,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { onSnapshot, doc, getDoc, addViewer, removeViewer, listenViewerCount, placeBid } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import Chat from "@/components/Chat";
import { useAuth } from "@/components/AuthProvider";

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
  const { user, loginWithGoogle } = useAuth();

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [active, setActive] = useState<ActiveView>({ id: null });
  const [remaining, setRemaining] = useState<number>(0);
  const [bid, setBid] = useState<number>(0);
  const [bidMsg, setBidMsg] = useState<string>("");
  const [viewerCount, setViewerCount] = useState<number>(0);

  // Access restriction: force login
  useEffect(() => {
    if (!user) {
      loginWithGoogle();
    }
  }, [user, loginWithGoogle]);

  // Viewer presence tracking
  useEffect(() => {
    if (!user?.uid) return;
    addViewer(channel, user.uid);
    return () => {
      removeViewer(channel, user.uid);
    };
  }, [channel, user?.uid]);

  // Listen for viewer count
  useEffect(() => {
    const unsub = listenViewerCount(channel, setViewerCount);
    return () => unsub();
  }, [channel]);

  // Join and render remote stream with dynamic import
  useEffect(() => {
    if (!user) return; // don't join if not logged in
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
      if (client) {
        client.leave().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, user]);

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
      const hb = typeof it?.highestBid === "number" ? it.highestBid : 0;
      setActive({ id: itemId, name: it?.name, highestBid: hb, endsAt: it?.endsAt ?? null });
      setBid(hb + 1);
    });
    return () => unsub();
  }, [channel]);

  // Countdown from endsAt
  useEffect(() => {
    const id = setInterval(() => {
      const ms = active?.endsAt ? Math.max(0, active.endsAt - Date.now()) : 0;
      setRemaining(Math.ceil(ms / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [active?.endsAt]);

  const onPlaceBid = async () => {
    setBidMsg("");
    if (!user) { setBidMsg("Please sign in to bid."); return; }
    if (!active.id) { setBidMsg("No active item."); return; }
    if (!bid || bid <= (active.highestBid ?? 0)) {
      setBidMsg(`Your bid must be greater than $${active.highestBid ?? 0}.`);
      return;
    }
    const res = await placeBid(channel, active.id, user.uid, bid);
    if (!res.ok) {
      setBidMsg("Bid failed (maybe someone outbid you first or timer ended). Try again.");
    } else {
      setBidMsg("Bid placed!");
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold">Please sign in to view this live auction.</h2>
        <button onClick={loginWithGoogle} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live: {channel}</h1>
      <div className="text-xs text-gray-500">Viewers: {viewerCount}</div>
      <div ref={videoRef} className="w-full flex justify-center bg-gray-50 rounded-lg py-2" />

      {active.id ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{active.name ?? "Active Item"}</div>
              <div className="text-sm text-gray-600">Highest bid: ${active.highestBid ?? 0}</div>
            </div>
            <div className="text-xl font-bold tabular-nums">
              {remaining}s
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              className="border rounded px-2 py-1 w-32"
              value={bid}
              min={(active.highestBid ?? 0) + 1}
              onChange={(e) => setBid(parseFloat(e.target.value || "0"))}
            />
            {user ? (
              <button onClick={onPlaceBid} className="px-3 py-2 rounded bg-green-600 text-white">
                Place Bid
              </button>
            ) : (
              <button onClick={loginWithGoogle} className="px-3 py-2 rounded bg-blue-600 text-white">
                Sign in to Bid
              </button>
            )}
          </div>
          {bidMsg && <p className="text-sm text-gray-600">{bidMsg}</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No active item yet.</p>
      )}

      {/* Chat */}
      <Chat channel={channel} />

      <p className="text-sm text-gray-500">
        Bids must increase and only count while the item is active. We’ll add payments with Stripe next.
      </p>
    </div>
  );
}