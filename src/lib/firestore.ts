import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc,
} from "firebase/firestore";
import type {
  DocumentData,
  DocumentReference,
  CollectionReference,
} from "firebase/firestore";

// Get Firestore user doc with custom fields
export async function getUserDoc(uid: string): Promise<any | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Set stripeAccountId for user
export async function setStripeAccountId(uid: string, stripeAccountId: string) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { stripeAccountId }, { merge: true });
}

// Add viewer to livestream
export async function addViewer(channel: string, uid: string) {
  const ref = doc(db, `livestreams/${channel}/viewers/${uid}`);
  await setDoc(ref, { joinedAt: Date.now() }, { merge: true });
}

// Remove viewer from livestream
export async function removeViewer(channel: string, uid: string) {
  const ref = doc(db, `livestreams/${channel}/viewers/${uid}`);
  await deleteDoc(ref);
}

// Listen to viewer count changes (returns unsubscribe)
export function listenViewerCount(channel: string, cb: (count: number) => void) {
  const ref = collection(db, `livestreams/${channel}/viewers`);
  return onSnapshot(ref, (snap) => cb(snap.size));
}

// Place bid on item
export async function placeBid(
  channel: string,
  itemId: string,
  uid: string,
  bid: number
): Promise<{ ok: boolean }> {
  const ref = doc(db, `livestreams/${channel}/items/${itemId}`);
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) return { ok: false };
  // Only allow bid if auction is active and bid is valid
  if (data.status !== "active") return { ok: false };
  if (typeof data.highestBid === "number" && bid <= data.highestBid) return { ok: false };
  await updateDoc(ref, {
    highestBid: bid,
    highestBidderUid: uid,
    lastBidAt: serverTimestamp(),
  });
  return { ok: true };
}

// Ensure stream exists (create if not)
export async function ensureStream(channel: string, sellerUid: string) {
  const ref = doc(db, "livestreams", channel);
  await setDoc(ref, { sellerUid, createdAt: serverTimestamp() }, { merge: true });
}

// Add item to stream's queue
export async function addQueueItem(channel: string, item: any) {
  const ref = collection(db, `livestreams/${channel}/items`);
  await addDoc(ref, { ...item, status: "queued", createdAt: serverTimestamp() });
}

// Activate item (set status to active and endsAt)
export async function activateItem(channel: string, itemId: string, durationSec: number) {
  const ref = doc(db, `livestreams/${channel}/items/${itemId}`);
  const endsAt = Date.now() + durationSec * 1000;
  await updateDoc(ref, { status: "active", activatedAt: serverTimestamp(), endsAt });
  // Update currentItemId at stream level
  const streamRef = doc(db, "livestreams", channel);
  await updateDoc(streamRef, { currentItemId: itemId });
}

// Clear active item (set status to ended/sold)
export async function clearActive(channel: string, itemId: string) {
  const ref = doc(db, `livestreams/${channel}/items/${itemId}`);
  await updateDoc(ref, { status: "ended", endedAt: serverTimestamp() });
  // Remove currentItemId at stream level
  const streamRef = doc(db, "livestreams", channel);
  await updateDoc(streamRef, { currentItemId: null });
}

// End stream (set status to ended)
export async function endStream(channel: string) {
  const ref = doc(db, "livestreams", channel);
  await updateDoc(ref, { status: "ended", endedAt: serverTimestamp() });
}

// Listen to chat messages
export function listenMessages(channel: string, cb: (messages: any[]) => void) {
  const ref = collection(db, `livestreams/${channel}/messages`);
  const q = query(ref, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Send chat message
export async function sendMessage(
  channel: string,
  uid: string,
  name: string,
  text: string
) {
  const ref = collection(db, `livestreams/${channel}/messages`);
  await addDoc(ref, {
    uid,
    name,
    text,
    createdAt: serverTimestamp(),
  });
}

// Create order when auction ends
export async function createOrder(order: {
  itemId: string,
  itemName: string,
  sellerUid: string,
  buyerUid: string,
  amount: number
}) {
  const ref = collection(db, "orders");
  await addDoc(ref, {
    ...order,
    status: "pending",
    createdAt: serverTimestamp()
  });
}

// Existing exports...
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
  where,
  deleteDoc,
};

export type { DocumentData, DocumentReference, CollectionReference };