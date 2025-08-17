"use client";

import { useEffect, useRef, useState } from "react";
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
  listenViewerCount,
  createOrder,
  getDoc,
  deleteDoc, // <-- import for queue item delete
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

  const [items, setItems] = useState<Item[]>([]);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  // For timer and active item
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [remaining, setRemaining] = useState<number>(0);

  const [viewerCount, setViewerCount] = useState<number>(0);

  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const TOKEN = null;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserUid(u?.uid ?? null));
    return () => unsub();
  }, []);

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
        } catch {}
        finally {
          if (videoRef.current) videoRef.current.innerHTML = "";
        }
      })();
    };
  }, []);

  // Watch queue + current item + active item
  useEffect(() => {
    if (!channel) return;

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

      // Find active item and update state
      const active = list.find(it => it.status === "active");
      setActiveItem(active || null);
    });

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

  // Timer for active item
  useEffect(() => {
    if (!activeItem?.endsAt) { setRemaining(0); return; }
    const id = setInterval(() => {
      const ms = activeItem?.endsAt ? Math.max(0, activeItem.endsAt - Date.now()) : 0;
      setRemaining(Math.ceil(ms / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [activeItem?.endsAt]);

  // Viewer count (for streamer, real-time)
  useEffect(() => {
    const unsub = listenViewerCount(channel, setViewerCount);
    return () => unsub();
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

  // --- UPDATED FUNCTION ---
  const endActive = async () => {
    if (!currentItemId) return;
    await clearActive(channel, currentItemId);

    // Fetch item to get winning bidder and create order
    const itemRef = doc(db, `livestreams/${channel}/items/${currentItemId}`);
    const itemSnap = await getDoc(itemRef);
    const item = itemSnap.data();

    // Only create order if there is a winner
    if (item?.highestBidderUid && typeof item?.highestBid === "number" && item?.name) {
      await createOrder({
        itemId: currentItemId,
        itemName: item.name,
        sellerUid: userUid!,
        buyerUid: item.highestBidderUid,
        amount: item.highestBid
      });
    }
  };
  // --- END UPDATED FUNCTION ---

  // Delete a queue item
  const deleteQueueItem = async (itemId: string) => {
    await deleteDoc(doc(db, `livestreams/${channel}/items/${itemId}`));
  };

  // queue form
  const [name, setName] = useState("");
  const [startingPrice, setStartingPrice] = useState(5);
  const [durationSec, setDurationSec] = useState(30);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 pb-20">
      <div className="space-y-10 max-w-3xl mx-auto pt-12">
        <h1 className="text-4xl font-black text-indigo-800 drop-shadow-sm mb-6 text-center">Go Live</h1>
        <div className="text-xs text-gray-500 mb-2 text-center">Viewers watching: <span className="font-bold">{viewerCount}</span></div>

        <div className="flex items-center gap-2 mb-2 justify-center">
          <label className="text-sm font-semibold">Channel:</label>
          <input
            className="border rounded px-2 py-1"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="channel-name"
          />
        </div>

        <div
          ref={videoRef}
          className="w-full flex justify-center bg-gray-100 rounded-lg py-2 shadow"
        />

        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {!isLive ? (
            <button
              onClick={start}
              className="px-4 py-2 rounded-xl bg-green-600 text-white shadow font-bold"
            >
              Start Stream
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-4 py-2 rounded-xl bg-red-600 text-white shadow font-bold"
            >
              End Stream
            </button>
          )}
          <button onClick={toggleCam} className="px-4 py-2 rounded-xl bg-gray-200 shadow font-bold">
            Toggle Camera
          </button>
          <button onClick={toggleMic} className="px-4 py-2 rounded-xl bg-gray-200 shadow font-bold">
            Toggle Mic
          </button>
        </div>

        {/* Queue composer */}
        <div className="rounded-xl border p-6 space-y-3 bg-gradient-to-tr from-white via-indigo-50 to-blue-100 shadow">
          <h2 className="font-semibold text-lg mb-2">Add Item to Queue</h2>
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
              className="px-3 py-2 rounded-xl bg-black text-white shadow font-bold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Queue list */}
        <div className="rounded-xl border p-6 space-y-2 bg-gradient-to-tr from-white via-indigo-50 to-blue-100 shadow">
          <h2 className="font-semibold text-lg mb-2">Queue</h2>
          {items.length === 0 && (
            <p className="text-sm text-gray-500">No items yet.</p>
          )}
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between border rounded p-3 bg-gray-50"
              >
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-xs text-gray-500">
                    ${it.startingPrice} • {it.durationSec}s • {it.status}
                    {it.status === "active" && it.endsAt
                      ? ` • ends at ${new Date(it.endsAt).toLocaleTimeString()}`
                      : ""}
                  </div>
                  {it.status === "active" ? (
                    <div className="text-xl font-bold tabular-nums text-blue-600">
                      {remaining}s
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {currentItemId === it.id ? (
                    <button
                      onClick={endActive}
                      className="px-3 py-1 rounded-xl bg-orange-500 text-white shadow"
                    >
                      End Active
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => activate(it.id, it.durationSec)}
                        className="px-3 py-1 rounded-xl bg-green-600 text-white shadow"
                      >
                        Activate
                      </button>
                      {it.status === "queued" && (
                        <button
                          onClick={() => deleteQueueItem(it.id)}
                          className="px-3 py-1 rounded-xl bg-red-600 text-white shadow"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-500 mt-2 text-center">
          Only one item can be active at a time. Activating sets a countdown
          (endsAt) in Firestore for viewers.
        </p>
      </div>
    </div>
  );
}