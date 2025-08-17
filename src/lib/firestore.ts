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
  getDocs,
  limit,
} from "firebase/firestore";
import type {
  DocumentData,
  DocumentReference,
  CollectionReference,
} from "firebase/firestore";

// --- Main App Functions ---

export async function getUserDoc(uid: string): Promise<any | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function setStripeAccountId(uid: string, stripeAccountId: string) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { stripeAccountId }, { merge: true });
}

export async function addViewer(channel: string, uid: string) {
  const ref = doc(db, `livestreams/${channel}/viewers/${uid}`);
  await setDoc(ref, { joinedAt: Date.now() }, { merge: true });
}

export async function removeViewer(channel: string, uid: string) {
  const ref = doc(db, `livestreams/${channel}/viewers/${uid}`);
  await deleteDoc(ref);
}

export function listenViewerCount(channel: string, cb: (count: number) => void) {
  const ref = collection(db, `livestreams/${channel}/viewers`);
  return onSnapshot(ref, (snap) => cb(snap.size));
}

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
  if (data.status !== "active") return { ok: false };
  if (typeof data.highestBid === "number" && bid <= data.highestBid) return { ok: false };
  await updateDoc(ref, {
    highestBid: bid,
    highestBidderUid: uid,
    lastBidAt: serverTimestamp(),
  });
  return { ok: true };
}

export async function ensureStream(channel: string, sellerUid: string) {
  const ref = doc(db, "livestreams", channel);
  await setDoc(ref, { sellerUid, createdAt: serverTimestamp() }, { merge: true });
}

export async function addQueueItem(channel: string, item: Record<string, unknown>) {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item) ||
    Object.prototype.toString.call(item) !== "[object Object]"
  ) {
    throw new Error(
      `addQueueItem: item must be a plain object. Got: ${JSON.stringify(item)}`
    );
  }
  const ref = collection(db, `livestreams/${channel}/items`);
  await addDoc(ref, { ...(item as Record<string, any>), status: "queued", createdAt: serverTimestamp() });
}

export async function activateItem(channel: string, itemId: string, durationSec: number) {
  const ref = doc(db, `livestreams/${channel}/items/${itemId}`);
  const endsAt = Date.now() + durationSec * 1000;
  await updateDoc(ref, { status: "active", activatedAt: serverTimestamp(), endsAt });
  const streamRef = doc(db, "livestreams", channel);
  await updateDoc(streamRef, { currentItemId: itemId });
}

export async function clearActive(channel: string, itemId: string) {
  const ref = doc(db, `livestreams/${channel}/items/${itemId}`);
  await updateDoc(ref, { status: "ended", endedAt: serverTimestamp() });
  const streamRef = doc(db, "livestreams", channel);
  await updateDoc(streamRef, { currentItemId: null });
}

export async function endStream(channel: string) {
  const ref = doc(db, "livestreams", channel);
  await updateDoc(ref, { status: "ended", endedAt: serverTimestamp() });
}

export async function updateStreamThumbnail(channel: string, thumbnailUrl: string) {
  const ref = doc(db, "livestreams", channel);
  await updateDoc(ref, { thumbnailUrl, thumbnailUpdatedAt: serverTimestamp() });
}

export function listenMessages(channel: string, cb: (messages: any[]) => void) {
  const ref = collection(db, `livestreams/${channel}/messages`);
  const q = query(ref, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any> || {}) })));
  });
}

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

export async function updateOrderStatus(orderId: string, status: string) {
  const ref = doc(db, "orders", orderId);
  await updateDoc(ref, { status });
}

export async function getFeaturedStreams(): Promise<any[]> {
  const q = query(
    collection(db, "livestreams"),
    where("status", "==", "live"),
    where("featured", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any> || {}) }));
}

export async function getPopularStreams(): Promise<any[]> {
  const q = query(
    collection(db, "livestreams"),
    where("status", "==", "live"),
    orderBy("viewerCount", "desc"),
    limit(5)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any> || {}) }));
}

export async function getStreamsByFilter(
  filter: { type: "" | "coral" | "fish" | "equipment"; sortBy: string }
): Promise<any[]> {
  let q: any = query(collection(db, "livestreams"), where("status", "==", "live"));
  if (filter.type) {
    q = query(q, where("type", "==", filter.type));
  }
  if (filter.sortBy === "viewers") {
    q = query(q, orderBy("viewerCount", "desc"));
  }
  if (filter.sortBy === "rating") {
    q = query(q, orderBy("rating", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any> || {}) }));
}

export async function getSellerAnalytics(sellerUid: string): Promise<any> {
  // Sales
  const ordersQ = query(collection(db, "orders"), where("sellerUid", "==", sellerUid), where("status", "in", ["pending", "completed"]));
  const ordersSnap = await getDocs(ordersQ);
  const sales = ordersSnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0);
  const itemsSold = ordersSnap.size;

  // Monthly sales (sold in current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyQ = query(
    collection(db, "orders"),
    where("sellerUid", "==", sellerUid),
    where("createdAt", ">=", monthStart)
  );
  const monthlySnap = await getDocs(monthlyQ);
  const monthlySales = monthlySnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0);

  // Rating/reviewCount from user doc
  const user = await getUserDoc(sellerUid);
  const rating = user?.rating ?? 0;
  const reviewCount = user?.reviewCount ?? 0;

  return { sales, itemsSold, monthlySales, rating, reviewCount };
}

export async function getMonthlyLeaderboard(): Promise<any[]> {
  const usersSnap = await getDocs(collection(db, "users"));
  const leaderboard: any[] = [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  for (const user of usersSnap.docs) {
    const sellerUid = user.id;
    const name = user.data().displayName ?? "Seller";
    const monthlyQ = query(
      collection(db, "orders"),
      where("sellerUid", "==", sellerUid),
      where("createdAt", ">=", monthStart)
    );
    const monthlySnap = await getDocs(monthlyQ);
    const monthlySales = monthlySnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0);
    leaderboard.push({ sellerUid, name, monthlySales });
  }

  leaderboard.sort((a, b) => b.monthlySales - a.monthlySales);

  return leaderboard.slice(0, 10); // top 10
}

// --- Firestore Helper Imports/Types ---
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
  getDocs,
  limit,
};

export type { DocumentData, DocumentReference, CollectionReference };