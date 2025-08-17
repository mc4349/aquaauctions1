"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function NavBar() {
  const pathname = usePathname();
  const { user, loginWithGoogle, logout } = useAuth();

  // Default tabs
  const tabs = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/alerts", label: "Alerts" },
  ];

  // If signed in, add the Stream tab
  if (user) {
    tabs.push({ href: "/stream", label: "Go Live" });
  }

  // Account tab is always visible
  tabs.push({ href: "/account", label: "Account" });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-400/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white drop-shadow">
          AquaAuctions
        </Link>
        <nav className="flex items-center gap-2">
          {tabs.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  active
                    ? "bg-black/80 text-white"
                    : "text-white/90 hover:bg-white/20"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-xs text-white/80">Signed in</span>
              <button
                onClick={logout}
                className="px-3 py-1 rounded bg-red-500 text-white font-bold shadow hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="px-4 py-1 rounded bg-blue-700 text-white font-bold shadow hover:bg-teal-600 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}