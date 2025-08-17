"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "orders"),
      where("sellerUid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap: any) => {
      setOrders(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Orders</h1>
      {orders.length === 0 && <p>No orders yet.</p>}
      <ul className="space-y-2">
        {orders.map(order => (
          <li key={order.id} className="border rounded p-3 flex flex-col">
            <div><strong>Item:</strong> {order.itemName}</div>
            <div><strong>Buyer:</strong> {order.buyerUid}</div>
            <div><strong>Amount:</strong> ${order.amount}</div>
            <div><strong>Status:</strong> {order.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}