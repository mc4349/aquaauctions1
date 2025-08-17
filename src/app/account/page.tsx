"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { getUserDoc, setDoc, doc } from "@/lib/firestore";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export default function AccountPage() {
  const { user, logout, loginWithGoogle } = useAuth();
  const [stripeStatus, setStripeStatus] = useState<"none" | "pending" | "connected">("none");
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [shipping, setShipping] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingSaved, setShippingSaved] = useState(false);

  // Load shipping info from Firestore
  useEffect(() => {
    async function loadShipping() {
      if (!user) return;
      const userDoc = await getUserDoc(user.uid);
      if (userDoc?.shippingInfo) setShipping(userDoc.shippingInfo);
      setDisplayName(user.displayName ?? userDoc?.displayName ?? "");
    }
    loadShipping();
  }, [user]);

  useEffect(() => {
    async function checkStripe() {
      if (!user) return;
      setLoading(true);
      const userDoc = await getUserDoc(user.uid);
      const stripeAccountId = userDoc?.stripeAccountId;
      if (!stripeAccountId) {
        setStripeStatus("none");
      } else {
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
        window.location.href = data.url;
      } else {
        alert("Error: " + (data.error || "Could not get Stripe onboarding link"));
      }
    } catch (e) {
      alert("Stripe onboarding failed.");
    }
    setLoading(false);
  };

  const handleNameChange = async () => {
    if (!user) return;
    // Update Firebase Auth displayName
    await updateProfile(user, { displayName });
    // Also update in Firestore user doc
    await setDoc(doc(db, "users", user.uid), { displayName }, { merge: true });
    alert("Name updated!");
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
    alert("Password reset email sent!");
  };

  const handleShippingSave = async () => {
    if (!user) return;
    setShippingLoading(true);
    await setDoc(doc(db, "users", user.uid), { shippingInfo: shipping }, { merge: true });
    setShippingSaved(true);
    setShippingLoading(false);
    setTimeout(() => setShippingSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-teal-100 to-cyan-200 pb-20">
      <div className="space-y-8 max-w-lg mx-auto pt-12">
        <h1 className="text-4xl font-black text-teal-700 drop-shadow-sm mb-6 text-center">Account</h1>
        {user ? (
          <>
            <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow space-y-2">
              <div className="mb-2">
                <label className="block font-bold mb-1">Display Name:</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  disabled={loading}
                />
                <button
                  onClick={handleNameChange}
                  className="mt-2 px-4 py-2 rounded bg-teal-600 text-white font-bold shadow hover:bg-teal-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Change Name
                </button>
              </div>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> <span className="font-mono">{user.uid}</span></p>
              {user.providerData?.[0]?.providerId === "password" && (
                <button
                  onClick={handlePasswordReset}
                  className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-bold shadow hover:bg-blue-700"
                >
                  Reset Password
                </button>
              )}
              {user.providerData?.[0]?.providerId === "google.com" && (
                <div className="mt-2 text-teal-800 text-sm">
                  Signed in with Google. To change Google account, logout and sign in with another account.
                </div>
              )}
            </div>
            <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow space-y-2">
              <h2 className="font-semibold text-lg mb-2">Shipping Information</h2>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Address"
                  value={shipping.address}
                  onChange={e => setShipping({ ...shipping, address: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={shipping.city}
                  onChange={e => setShipping({ ...shipping, city: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={shipping.state}
                  onChange={e => setShipping({ ...shipping, state: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  type="text"
                  placeholder="Zip"
                  value={shipping.zip}
                  onChange={e => setShipping({ ...shipping, zip: e.target.value })}
                  className="border rounded px-3 py-2 w-full"
                />
                <button
                  onClick={handleShippingSave}
                  className="mt-2 px-4 py-2 rounded bg-teal-600 text-white font-bold shadow hover:bg-teal-700 disabled:opacity-50"
                  disabled={shippingLoading}
                >
                  {shippingLoading ? "Saving..." : "Save Shipping Info"}
                </button>
                {shippingSaved && (
                  <div className="text-green-700 text-sm mt-1">Saved!</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border p-6 bg-gradient-to-tr from-white via-blue-50 to-teal-100 shadow space-y-2">
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
                className="px-4 py-2 rounded-xl bg-teal-600 text-white shadow font-bold"
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