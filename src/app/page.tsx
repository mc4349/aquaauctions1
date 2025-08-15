"use client";

import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-4">
      <h1 className="text-3xl font-bold">AquaAuctions</h1>

      {user ? (
        <>
          <p className="text-lg">Signed in as <strong>{user.displayName ?? user.email}</strong></p>
          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-red-500 text-white"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={loginWithGoogle}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Sign in with Google
        </button>
      )}
    </main>
  );
}
