// src/app/stream/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
// Types only (no runtime import on the server)
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  ensureStream,
  addQueueItem,
  activateItem,
  clearActive,
  endStream,
  onSnapshot,
  collection,
  query,
  orderBy,
  doc,
} from "../../lib/firestore";
import type { DocumentData } from "../../lib/firestore";

type Item = {
  id: string;
  name: string;
  startingPrice: number;
  durationSec: number;
  status: "queued" | "active" | "sold" | "passed";
  highestBid?: number;
  endsAt?: number | null;
};

export default function StreamPage() {
  const videoRef = useRef<HTMLDivElement | null>(null);

  // Keep latest Agora client & tracks in refs to avoid stale closures
  const agoraRef = useRef<any>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const camRef = useRef<ICameraVideoTrack | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [cam, setCam] = useState<ICameraVideoTrack | null>(null);
  const [mic, setMic] = useState<IMicrophoneAudioTrack | null>(null);
  const [isLive, setIsLive] = useState(false);

  const [channel, setChannel] = useState("aqua-demo");
  const [userUid, setUserUid] = useState<string | null>(null);

  // queue form
  const [name, setName] = useState("");
  const [startingPrice, setStartingPrice] = useState(5);
  const [durationSec, setDurationSec] = useState(30);

  const [items, setItems] = useState<Item[]>([]);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const TOKEN = null;

  // Listen auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  // Dynamically import Agora on the client and create the client
  useEffect(() => {
    let disposed = false;
    let localClient: IAgoraRTCClient | null = null;

    (async () => {
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
      if (disposed) return;

      agoraRef.current = AgoraRTC;

      localClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = localClient;
      setClient(localClient);
    })();

    return () => {
      disposed = true;
      (async () => {
        try {
          if (camRef.current) {
            camRef.current.stop();
            camRef.current.close();
            camRef.current = null;
          }
          if (micRef.current) {
            micRef.current.stop();
            micRef.current.close();
            micRef.current = null;
          }
          if (localClient) {
            await localClient.unpublish();
            await localClient.leave();
          }
        } catch {
          // ignore
        } finally {
          if (videoRef.current) videoRef.current.innerHTML = "";
        }
      })();
    };
  }, []);

  // Watch queue + current item
  useEffect(() => {
    if (!channel) return;

    // items listener
    const q = query(
      collection(db, "livestreams", channel, "items"),
      orderBy("createdAt", "asc")
    );
    const unsubItems = onSnapshot(q, (snap: any) => {
      const list: Item[] = [];
      snap.forEach((d: any) => {
        const data = d.data() as DocumentData;
        list.push({
          id: d.id,
          name: data.name,
          startingPrice: data.startingPrice,
          durationSec: data.durationSec,
          status: data.status,
          highestBid: data.highestBid,
          endsAt: data.endsAt ?? null,
        });
      });
      setItems(list);
    });

    // stream listener (for currentItemId)
    const streamRef = doc(db, "livestreams", channel);
    const unsubStream = onSnapshot(streamRef, (d: any) => {
      const data = d.data() as DocumentData | undefined;
      setCurrentItemId(data?.currentItemId ?? null);
    });

    return () => {
      unsubItems();
      unsubStream();
    };
  }, [channel]);

  const start = async () => {
    const AgoraRTC = agoraRef.current;
    const c = clientRef.current;
    if (!userUid) return alert("Sign in first.");
    if (!AgoraRTC || !c) return alert("Video engine not ready yet—try again in a second.");

    await ensureStream(channel, userUid);

    await c.join(APP_ID, channel, TOKEN, null);
    const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const camTrack = await AgoraRTC.createCameraVideoTrack();
    await c.publish([micTrack, camTrack]);

    micRef.current = micTrack;
    camRef.current = camTrack;
    setMic(micTrack);
    setCam(camTrack);
    setIsLive(true);

    if (videoRef.current) {
      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.maxWidth = "900px";
      container.style.aspectRatio = "16/9";
      container.style.borderRadius = "12px";
      container.style.overflow = "hidden";
      videoRef.current.innerHTML = "";
      videoRef.current.appendChild(container);
      camTrack.play(container);
    }
  };

  const stop = async () => {
    const c = clientRef.current;
    try {
      await endStream(channel);

      if (camRef.current) {
        camRef.current.stop();
        camRef.current.close();
        camRef.current = null;
      }
      if (micRef.current) {
        micRef.current.stop();
        micRef.current.close();
        micRef.current = null;
      }
      if (c) {
        await c.unpublish();
        await c.leave();
      }
    } finally {
      setIsLive(false);
      setCam(null);
      setMic(null);
      if (videoRef.current) videoRef.current.innerHTML = "";
    }
  };

  const toggleCam = async () => {
    if (!camRef.current) return;
    await camRef.current.setEnabled(!(camRef.current as any).enabled);
  };

  const toggleMic = async () => {
    if (!micRef.current) return;
    await micRef.current.setEnabled(!(micRef.current as any).enabled);
  };

  const addItem = async () => {
    if (!userUid) return alert("Sign in first.");
    if (!name.trim()) return alert("Enter a name");
    await addQueueItem(channel, { name, startingPrice, durationSec });
    setName("");
    setStartingPrice(5);
    setDurationSec(30);
  };

  const activate = async (id: string, dur: number) => {
    await activateItem(channel, id, dur);
  };

  const endActive = async () => {
    await clearActive(channel);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Go Live</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Channel:</label>
        <input
          className="border rounded px-2 py-1"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="channel-name"
        />
      </div>

      <div
        ref={videoRef}
        className="w-full flex justify-center bg-gray-50 rounded-lg py-2"
      />

      <div className="flex flex-wrap gap-3">
        {!isLive ? (
          <button
            onClick={start}
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Start Stream
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            End Stream
          </button>
        )}
        <button onClick={toggleCam} className="px-4 py-2 rounded bg-gray-200">
          Toggle Camera
        </button>
        <button onClick={toggleMic} className="px-4 py-2 rounded bg-gray-200">
          Toggle Mic
        </button>
      </div>

      {/* Queue composer */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Add Item to Queue</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="border rounded px-2 py-1"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            className="border rounded px-2 py-1 w-28"
            placeholder="Starting $"
            value={startingPrice}
            onChange={(e) =>
              setStartingPrice(parseFloat(e.target.value || "0"))
            }
          />
          <select
            className="border rounded px-2 py-1"
            value={durationSec}
            onChange={(e) => setDurationSec(parseInt(e.target.value))}
          >
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={120}>2m</option>
          </select>
          <button
            onClick={addItem}
            className="px-3 py-2 rounded bg-black text-white"
          >
            Add
          </button>
        </div>
      </div>

      {/* Queue list */}
      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold">Queue</h2>
        {items.length === 0 && (
          <p className="text-sm text-gray-500">No items yet.</p>
        )}
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between border rounded p-2"
            >
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">
                  ${it.startingPrice} • {it.durationSec}s • {it.status}
                  {it.status === "active" && it.endsAt
                    ? ` • ends at ${new Date(it.endsAt).toLocaleTimeString()}`
                    : ""}
                </div>
              </div>
              <div className="flex gap-2">
                {currentItemId === it.id ? (
                  <button
                    onClick={endActive}
                    className="px-3 py-1 rounded bg-orange-500 text-white"
                  >
                    End Active
                  </button>
                ) : (
                  <button
                    onClick={() => activate(it.id, it.durationSec)}
                    className="px-3 py-1 rounded bg-green-600 text-white"
                  >
                    Activate
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-gray-500">
        Only one item can be active at a time. Activating sets a countdown
        (endsAt) in Firestore for viewers.
      </p>
    </div>
  );
}
