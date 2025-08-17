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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Account</h1>

      {user ? (
        <>
          <div className="rounded-lg border p-4 space-y-2">
            <p><strong>Name:</strong> {user.displayName ?? "—"}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> {user.uid}</p>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h2 className="font-semibold">Payouts Setup</h2>
            {loading ? (
              <p>Loading...</p>
            ) : stripeStatus === "connected" ? (
              <div className="flex items-center gap-2 text-green-600 font-bold">
                <span>✅ Connected</span>
              </div>
            ) : (
              <button
                onClick={handleStripeOnboard}
                className="px-4 py-2 rounded bg-blue-600 text-white"
                disabled={loading}
              >
                {loading ? "Redirecting..." : "Setup payouts"}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Required to receive auction payouts.
            </p>
          </div>

          <div className="flex gap-3">
            {/* Shown only when signed in */}
            <Link
              href="/stream"
              className="px-4 py-2 rounded bg-green-600 text-white"
            >
              Go Live
            </Link>

            <button
              onClick={logout}
              className="px-4 py-2 rounded bg-red-500 text-white"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <p>You’re not signed in.</p>
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}