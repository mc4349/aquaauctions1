"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function HomePage() {
  const { user, loginWithGoogle } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-200 via-teal-100 to-cyan-200 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full space-y-8 rounded-2xl shadow-xl bg-gradient-to-tr from-white via-blue-50 to-teal-50 p-8 border border-blue-100">
        <h1 className="text-5xl font-extrabold text-teal-700 text-center drop-shadow mb-4">
          Welcome to Aqua Auctions
        </h1>
        <p className="text-lg text-blue-900 text-center mb-4">
          Dive into live auctions for coral, fish, and aquatic gear. Join streams, bid, and connect with fellow aquarists!
        </p>

        <div className="flex flex-col items-center space-y-4">
          {!user ? (
            <>
              <button
                onClick={loginWithGoogle}
                className="px-6 py-3 rounded-full bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-teal-600 transition"
              >
                Sign in with Google
              </button>
              <p className="text-sm text-teal-700">Sign in to explore auctions and live streams.</p>
            </>
          ) : (
            <>
              <Link
                href="/explore"
                className="px-6 py-3 rounded-full bg-teal-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition"
              >
                Explore Auctions
              </Link>
              <Link
                href="/account"
                className="px-6 py-3 rounded-full bg-cyan-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition"
              >
                Account Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
      <footer className="mt-12 text-teal-800 text-sm opacity-70">
        &copy; {new Date().getFullYear()} Aqua Auctions — Dive in!
      </footer>
    </main>
  );
}