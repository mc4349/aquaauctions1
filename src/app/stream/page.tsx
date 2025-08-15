"use client";

import { useEffect, useRef, useState } from "react";
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

export default function StreamPage() {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [cam, setCam] = useState<ICameraVideoTrack | null>(null);
  const [mic, setMic] = useState<IMicrophoneAudioTrack | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [channel, setChannel] = useState("aquaauctions-demo"); // simple default for testing

  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
  const TOKEN = null; // tokenless for local testing; we’ll secure later

  useEffect(() => {
    // Use 'live' mode for streaming; 'rtc' also works for a quick test
    const c = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    setClient(c);
    return () => {
      // cleanup on unmount
      (async () => {
        try {
          if (cam) cam.close();
          if (mic) mic.close();
          if (c) {
            const tracks = cam && mic ? [mic, cam] : cam ? [cam] : mic ? [mic] : [];
            if (tracks.length) await c.unpublish(tracks as any);
            await c.leave();
          }
        } catch {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (!client) return;
    await client.join(APP_ID, channel, TOKEN, null);
    const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const camTrack = await AgoraRTC.createCameraVideoTrack();
    await client.publish([micTrack, camTrack]);
    setMic(micTrack);
    setCam(camTrack);
    setIsLive(true);

    // Render local video in the container
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
    if (!client) return;
    try {
      if (cam) {
        cam.stop();
        cam.close();
      }
      if (mic) {
        mic.stop();
        mic.close();
      }
      await client.unpublish();
      await client.leave();
    } finally {
      setIsLive(false);
      setCam(null);
      setMic(null);
      if (videoRef.current) videoRef.current.innerHTML = "";
    }
  };

  const toggleCam = async () => {
    if (!cam) return;
    if ((cam as any).enabled) await cam.setEnabled(false);
    else await cam.setEnabled(true);
  };

  const toggleMic = async () => {
    if (!mic) return;
    if ((mic as any).enabled) await mic.setEnabled(false);
    else await mic.setEnabled(true);
  };

  return (
    <div className="space-y-4">
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

      <div ref={videoRef} className="w-full flex justify-center bg-gray-50 rounded-lg py-2" />

      <div className="flex flex-wrap gap-3">
        {!isLive ? (
          <button onClick={start} className="px-4 py-2 rounded bg-green-600 text-white">
            Start Stream
          </button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded bg-red-600 text-white">
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

      <p className="text-sm text-gray-500">
        Tip: share the channel name with viewers. They can watch at <code>/live/&lt;channel&gt;</code>.
      </p>
    </div>
  );
}
