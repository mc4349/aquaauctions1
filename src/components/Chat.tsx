"use client";

import { useEffect, useRef, useState } from "react";
import { listenMessages, sendMessage } from "@/lib/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function Chat({ channel }: { channel: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Array<{ id: string; uid: string; name?: string | null; text: string }>>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = listenMessages(channel, (m) => {
      setMsgs(m);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    });
    return () => unsub();
  }, [channel]);

  const onSend = async () => {
    if (!user) return alert("Sign in to chat.");
    if (!text.trim()) return;
    await sendMessage(channel, user.uid, user.displayName ?? user.email ?? "User", text);
    setText("");
  };

  return (
    <div className="rounded-lg border p-3 flex flex-col h-80">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {msgs.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.name ?? "User"}: </span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder={user ? "Type a message…" : "Sign in to chat"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          disabled={!user}
        />
        <button
          onClick={onSend}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
          disabled={!user || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
