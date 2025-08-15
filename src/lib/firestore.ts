// src/lib/firestore.ts
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import type {
  DocumentData,
  DocumentReference,
  CollectionReference,
} from "firebase/firestore";

// Ensure a livestream doc exists for a channel with this seller
export async function ensureStream(channel: string, sellerUid: string) {
  const ref = doc(db, "livestreams", channel);
  await setDoc(
    ref,
    {
      channel,
      sellerUid,
      status: "live", // "live" | "ended"
      startedAt: serverTimestamp(),
      currentItemId: null,
    },
    { merge: true }
  );
  return ref;
}

export async function endStream(channel: string) {
  const ref = doc(db, "livestreams", channel);
  await updateDoc(ref, {
    status: "ended",
    endedAt: serverTimestamp(),
    currentItemId: null,
  });
}

export async function addQueueItem(
  channel: string,
  item: {
    name: string;
    startingPrice: number;
    durationSec: number; // 30 | 60 | 120
    imageUrl?: string;
    category?: "coral" | "fish" | "equipment";
  }
) {
  const itemsRef = collection(db, "livestreams", channel, "items");
  return addDoc(itemsRef, {
    ...item,
    status: "queued", // queued | active | sold | passed
    highestBid: item.startingPrice,
    highestBidderUid: null,
    createdAt: serverTimestamp(),
    endsAt: null,
  });
}

export async function activateItem(
  channel: string,
  itemId: string,
  durationSec: number
) {
  const streamRef = doc(db, "livestreams", channel);
  const endsAt = Date.now() + durationSec * 1000;

  await updateDoc(streamRef, { currentItemId: itemId });
  const itemRef = doc(db, "livestreams", channel, "items", itemId);
  await updateDoc(itemRef, { status: "active", endsAt });
}

export async function clearActive(channel: string) {
  const streamRef = doc(db, "livestreams", channel);
  await updateDoc(streamRef, { currentItemId: null });
}

// Re-export runtime helpers
export {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
};

// Re-export types (type-only to satisfy isolatedModules)
export type { DocumentData, DocumentReference, CollectionReference };
