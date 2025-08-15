"use client";

import { useAuth } from "@/components/AuthProvider";

export default function AccountPage() {
  const { user, logout, loginWithGoogle } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Account</h1>

      {user ? (
        <>
          <div className="rounded-lg border p-4">
            <p><strong>Name:</strong> {user.displayName ?? "—"}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> {user.uid}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded bg-red-500 text-white"
          >
            Logout
          </button>
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
