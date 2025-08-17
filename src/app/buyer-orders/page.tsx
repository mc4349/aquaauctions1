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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 pb-20">
      <div className="max-w-2xl mx-auto pt-12 space-y-10">
        <h1 className="text-4xl font-black text-indigo-800 drop-shadow-sm mb-6 text-center">
          Your Purchases
        </h1>
        {orders.length === 0 && (
          <div className="rounded bg-yellow-100 p-6 text-yellow-900 text-center font-semibold shadow">
            No purchases yet.
          </div>
        )}
        <ul className="space-y-8">
          {orders.map(order => (
            <li key={order.id} className="rounded-xl p-6 shadow-lg bg-gradient-to-tr from-white via-indigo-50 to-blue-100 border border-indigo-100 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-lg text-indigo-700">{order.itemName}</div>
                  <div className="text-xs text-gray-500">Seller: <span className="font-mono">{order.sellerUid}</span></div>
                </div>
                <span className={`px-4 py-1 rounded-xl text-xs font-bold shadow
                  ${order.status === "pending" ? "bg-yellow-300 text-yellow-900"
                    : order.status === "paid" ? "bg-green-400 text-green-900"
                    : order.status === "awaiting_payment" ? "bg-blue-300 text-blue-900"
                    : order.status === "shipped" ? "bg-purple-300 text-purple-900"
                    : order.status === "completed" ? "bg-gray-300 text-gray-700"
                    : order.status === "cancelled" ? "bg-red-300 text-red-900"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                  {order.status}
                </span>
              </div>
              <div className="text-md font-semibold text-cyan-800 mt-2">Amount: <span className="font-mono text-cyan-900">${order.amount}</span></div>
              <div className="flex gap-3 mt-3">
                {order.status === "awaiting_payment" && (
                  <button
                    onClick={() => handleStatusChange(order.id, "paid")}
                    disabled={loadingOrderId === order.id}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold shadow hover:bg-green-700 transition"
                  >
                    {loadingOrderId === order.id ? "..." : "Mark as Paid"}
                  </button>
                )}
                {order.status === "shipped" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, "completed")}
                      disabled={loadingOrderId === order.id}
                      className="px-4 py-2 rounded-xl bg-gray-700 text-white text-sm font-bold shadow hover:bg-gray-800 transition"
                    >
                      {loadingOrderId === order.id ? "..." : "Mark as Received"}
                    </button>
                    <button
                      onClick={() => handleStatusChange(order.id, "cancelled")}
                      disabled={loadingOrderId === order.id}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold shadow hover:bg-red-700 transition"
                    >
                      {loadingOrderId === order.id ? "..." : "Cancel"}
                    </button>
                  </>
                )}
                {order.status === "pending" && (
                  <span className="px-4 py-1 rounded-xl bg-yellow-100 text-yellow-900 font-semibold text-sm">Waiting for seller confirmation...</span>
                )}
                {order.status === "paid" && (
                  <span className="px-4 py-1 rounded-xl bg-green-100 text-green-900 font-semibold text-sm">Paid - waiting for shipment</span>
                )}
                {order.status === "completed" && (
                  <span className="px-4 py-1 rounded-xl bg-gray-200 text-gray-700 font-semibold text-sm">Completed</span>
                )}
                {order.status === "cancelled" && (
                  <span className="px-4 py-1 rounded-xl bg-red-200 text-red-900 font-semibold text-sm">Cancelled</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}