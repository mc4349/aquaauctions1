"use client";

import { useEffect, useState } from "react";
import { getSellerAnalytics, getMonthlyLeaderboard } from "@/lib/firestore";
import { useAuth } from "@/components/AuthProvider";

type SellerAnalytics = {
  sales: number;
  itemsSold: number;
  rating: number;
  reviewCount: number;
  monthlySales: number;
};

type LeaderboardEntry = {
  sellerUid: string;
  name: string;
  monthlySales: number;
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (user?.uid) getSellerAnalytics(user.uid).then(setAnalytics);
    getMonthlyLeaderboard().then(setLeaderboard);
  }, [user?.uid]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-teal-100 to-cyan-200 pb-20">
      <div className="space-y-8 max-w-2xl mx-auto pt-12">
        <h1 className="text-4xl font-black text-teal-700 drop-shadow mb-8 text-center">
          Seller Analytics & Leaderboard
        </h1>
        {/* Seller Analytics */}
        {analytics && (
          <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow space-y-2 mb-6">
            <h2 className="font-semibold text-lg mb-2">Your Analytics</h2>
            <p>Total Sales: <span className="font-bold">${analytics.sales}</span></p>
            <p>Items Sold: <span className="font-bold">{analytics.itemsSold}</span></p>
            <p>Monthly Sales: <span className="font-bold">${analytics.monthlySales}</span></p>
            <div>
              <span>Rating: <span className="font-bold">{analytics.rating}</span> ({analytics.reviewCount} reviews)</span>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow space-y-2">
          <h2 className="font-semibold text-lg mb-2">Monthly Sales Leaderboard</h2>
          <ul>
            {leaderboard.map((entry, i) => (
              <li key={entry.sellerUid} className="flex justify-between items-center px-2 py-2 border-b">
                <span>
                  <span className="font-bold text-teal-700">{i + 1}.</span> {entry.name}
                </span>
                <span className="font-bold">${entry.monthlySales}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}