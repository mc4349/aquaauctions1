"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import AgoraRTC, {
  IAgoraRTCClient,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";

export default function LiveViewerPage() {
  // Read the dynamic route param: /live/[channel]
  const params = useParams<{ channel: string }>();
  const channel = Array.isArray(params.channel) ? params.channel[0] : params.channel;

  const videoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let client: IAgoraRTCClient | null = null;

    const run = async () => {
      // Create a viewer client
      client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Subscribe when the seller publishes tracks
      client.on("user-published", async (user: any, mediaType: "video" | "audio") => {
        await client!.subscribe(user, mediaType);

        if (mediaType === "video") {
          const track = user.videoTrack as IRemoteVideoTrack | null;
          if (track && videoRef.current) {
            const container = document.createElement("div");
            container.style.width = "100%";
            container.style.maxWidth = "900px";
            container.style.aspectRatio = "16/9";
            container.style.borderRadius = "12px";
            container.style.overflow = "hidden";

            // Clear any previous element and mount
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

      client.on("user-unpublished", () => {
        if (videoRef.current) videoRef.current.innerHTML = "";
      });

      const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
      await client.join(APP_ID, channel, null, null);
    };

    run();

    return () => {
      (async () => {
        try {
          if (client) await client.leave();
        } catch {
          // ignore
        }
      })();
    };
  }, [channel]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live: {channel}</h1>
      <div ref={videoRef} className="w-full flex justify-center bg-gray-50 rounded-lg py-2" />
      <p className="text-sm text-gray-500">
        If you don’t see video, make sure the seller is live on this channel.
      </p>
    </div>
  );
}
