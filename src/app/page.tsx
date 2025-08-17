"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function HomePage() {
  const { user, loginWithGoogle } = useAuth();

  return (
    <main className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center pb-24">
      <div className="max-w-xl w-full space-y-8 rounded-2xl shadow-xl bg-neutral-800 p-8 border border-neutral-700">
        <h1 className="text-5xl font-extrabold text-lime-400 text-center drop-shadow mb-4">
          Welcome to Aqua Auctions
        </h1>
        <p className="text-lg text-neutral-400 text-center mb-4">
          Dive into live auctions for coral, fish, and aquatic gear. Join streams, bid, and connect with fellow aquarists!
        </p>

        <div className="flex flex-col items-center space-y-4">
          {!user ? (
            <>
              <button
                onClick={loginWithGoogle}
                className="btn-accent text-lg shadow-lg hover:bg-lime-300 transition"
              >
                Sign in with Google
              </button>
              <Link
                href="/signup"
                className="btn-accent text-lg shadow-lg hover:bg-lime-300 transition"
              >
                Sign up
              </Link>
              <p className="text-sm text-lime-400">Sign in or sign up to explore auctions and live streams.</p>
            </>
          ) : (
            <div className="flex flex-row justify-center gap-4">
              <Link
                href="/explore"
                className="btn-accent text-lg shadow-lg hover:bg-lime-300 transition"
              >
                Explore Auctions
              </Link>
              <Link
                href="/stream"
                className="btn-accent text-lg shadow-lg hover:bg-lime-300 transition"
              >
                Go Live
              </Link>
              <Link
                href="/account"
                className="btn-accent text-lg shadow-lg hover:bg-lime-300 transition"
              >
                Account Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
      <footer className="mt-12 text-neutral-400 text-sm opacity-70">
        &copy; {new Date().getFullYear()} Aqua Auctions — Dive in!
      </footer>
    </main>
  );
}