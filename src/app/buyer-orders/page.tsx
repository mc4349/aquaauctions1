"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateOrderStatus } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "orders"),
      where("buyerUid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap: any) => {
      setOrders(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  const handleStatusChange = async (orderId: string, status: string) => {
    setLoadingOrderId(orderId);
    await updateOrderStatus(orderId, status);
    setLoadingOrderId(null);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Your Purchases</h1>
      {orders.length === 0 && <p>No purchases yet.</p>}
      <ul className="space-y-4">
        {orders.map(order => (
          <li key={order.id} className="border rounded-lg p-4 bg-white shadow flex flex-col gap-2">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold text-lg">{order.itemName}</div>
                <div className="text-sm text-gray-500">Seller: {order.sellerUid}</div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded text-sm font-bold
                  ${order.status === "pending" ? "bg-yellow-200 text-yellow-800"
                    : order.status === "paid" ? "bg-green-200 text-green-800"
                    : order.status === "awaiting_payment" ? "bg-blue-200 text-blue-800"
                    : order.status === "shipped" ? "bg-purple-200 text-purple-800"
                    : order.status === "completed" ? "bg-gray-300 text-gray-700"
                    : order.status === "cancelled" ? "bg-red-200 text-red-800"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                  {order.status}
                </span>
              </div>
            </div>
            <div className="text-sm">Amount: <span className="font-mono">${order.amount}</span></div>
            <div className="flex gap-2 mt-2">
              {order.status === "awaiting_payment" && (
                <button
                  onClick={() => handleStatusChange(order.id, "paid")}
                  disabled={loadingOrderId === order.id}
                  className="px-3 py-1 rounded bg-green-600 text-white text-sm"
                >
                  {loadingOrderId === order.id ? "..." : "Mark as Paid"}
                </button>
              )}
              {order.status === "shipped" && (
                <>
                  <button
                    onClick={() => handleStatusChange(order.id, "completed")}
                    disabled={loadingOrderId === order.id}
                    className="px-3 py-1 rounded bg-gray-700 text-white text-sm"
                  >
                    {loadingOrderId === order.id ? "..." : "Mark as Received"}
                  </button>
                  <button
                    onClick={() => handleStatusChange(order.id, "cancelled")}
                    disabled={loadingOrderId === order.id}
                    className="px-3 py-1 rounded bg-red-600 text-white text-sm"
                  >
                    {loadingOrderId === order.id ? "..." : "Cancel"}
                  </button>
                </>
              )}
              {order.status === "pending" && (
                <span className="px-3 py-1 rounded bg-yellow-200 text-yellow-800 text-sm">Waiting for seller confirmation...</span>
              )}
              {order.status === "paid" && (
                <span className="px-3 py-1 rounded bg-green-200 text-green-800 text-sm">Paid - waiting for shipment</span>
              )}
              {order.status === "completed" && (
                <span className="px-3 py-1 rounded bg-gray-300 text-gray-700 text-sm">Completed</span>
              )}
              {order.status === "cancelled" && (
                <span className="px-3 py-1 rounded bg-red-200 text-red-800 text-sm">Cancelled</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}