"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "alerts"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap: any) => {
      setAlerts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-teal-100 to-cyan-200 pb-20">
      <div className="max-w-xl mx-auto pt-12 space-y-10">
        <h1 className="text-4xl font-black text-teal-700 drop-shadow-sm mb-6 text-center">
          Alerts
        </h1>
        {alerts.length === 0 ? (
          <div className="rounded bg-yellow-100 p-6 text-yellow-900 text-center font-semibold shadow">
            No alerts yet.
          </div>
        ) : (
          <ul className="space-y-5">
            {alerts.map(alert => (
              <li key={alert.id} className="rounded-xl p-5 shadow-lg bg-gradient-to-tr from-white via-blue-50 to-teal-100 border border-teal-100 flex flex-col gap-2">
                <div className="font-bold text-lg text-teal-700">{alert.title ?? "Alert"}</div>
                <div className="text-md text-blue-900">{alert.message}</div>
                <div className="text-xs text-gray-500 mt-2">Received: {alert.createdAt?.toDate?.().toLocaleString?.() ?? ""}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}