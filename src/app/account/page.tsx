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
    <div className="space-y-8 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-4">Account</h1>

      {user ? (
        <>
          <div className="rounded-lg border p-6 bg-white shadow space-y-2">
            <p><strong>Name:</strong> {user.displayName ?? "—"}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> <span className="font-mono">{user.uid}</span></p>
          </div>

          <div className="rounded-lg border p-6 bg-white shadow space-y-2">
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
                className="px-4 py-2 rounded bg-blue-600 text-white shadow"
                disabled={loading}
              >
                {loading ? "Redirecting..." : "Setup payouts"}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Required to receive auction payouts.
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Link
              href="/stream"
              className="px-4 py-2 rounded bg-green-600 text-white shadow"
            >
              Go Live
            </Link>

            <button
              onClick={logout}
              className="px-4 py-2 rounded bg-red-500 text-white shadow"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded bg-blue-50 p-4 text-blue-700 mb-3">You’re not signed in.</div>
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 rounded bg-blue-600 text-white shadow"
          >
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}