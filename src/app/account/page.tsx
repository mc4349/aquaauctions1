"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { getUserDoc } from "@/lib/firestore";

export default function AccountPage() {
  const { user, logout, loginWithGoogle } = useAuth();
  const [stripeStatus, setStripeStatus] = useState<"none" | "pending" | "connected">("none");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkStripe() {
      if (!user) return;
      setLoading(true);
      // Get Firestore user doc
      const userDoc = await getUserDoc(user.uid);
      const stripeAccountId = userDoc?.stripeAccountId;
      if (!stripeAccountId) {
        setStripeStatus("none");
      } else {
        // Optionally: check account status from Stripe API if you want stricter verification
        setStripeStatus("connected");
      }
      setLoading(false);
    }
    checkStripe();
  }, [user]);

  const handleStripeOnboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe onboarding
      } else {
        alert("Error: " + (data.error || "Could not get Stripe onboarding link"));
      }
    } catch (e) {
      alert("Stripe onboarding failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 pb-20">
      <div className="space-y-8 max-w-lg mx-auto pt-12">
        <h1 className="text-4xl font-black text-indigo-800 drop-shadow-sm mb-6 text-center">Account</h1>

        {user ? (
          <>
            <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-indigo-50 to-blue-100 shadow space-y-2">
              <p><strong>Name:</strong> {user.displayName ?? "—"}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> <span className="font-mono">{user.uid}</span></p>
            </div>

            <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-indigo-50 to-blue-100 shadow space-y-2">
              <h2 className="font-semibold text-lg mb-2">Payouts Setup</h2>
              {loading ? (
                <p className="text-blue-600">Loading...</p>
              ) : stripeStatus === "connected" ? (
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <span>✅ Connected</span>
                </div>
              ) : (
                <button
                  onClick={handleStripeOnboard}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white shadow font-bold"
                  disabled={loading}
                >
                  {loading ? "Redirecting..." : "Setup payouts"}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Required to receive auction payouts.
              </p>
            </div>

            <div className="flex gap-3 mt-4 justify-center">
              <Link
                href="/stream"
                className="px-4 py-2 rounded-xl bg-green-600 text-white shadow font-bold"
              >
                Go Live
              </Link>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-red-500 text-white shadow font-bold"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded bg-blue-100 p-4 text-blue-900 mb-3 text-center font-semibold shadow">You’re not signed in.</div>
            <div className="flex justify-center">
              <button
                onClick={loginWithGoogle}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white shadow font-bold"
              >
                Sign in with Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}