"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { HomeIcon, VideoCameraIcon, UserIcon, BellIcon } from "@heroicons/react/24/outline";

// Compact bottom navigation bar for mobile & desktop
export default function NavBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const tabs = [
    { href: "/", label: "Home", icon: <HomeIcon className="w-5 h-5" /> },
    { href: "/explore", label: "Explore", icon: <VideoCameraIcon className="w-5 h-5" /> },
    { href: "/alerts", label: "Alerts", icon: <BellIcon className="w-5 h-5" /> },
    ...(user ? [{ href: "/stream", label: "Go Live", icon: <VideoCameraIcon className="w-5 h-5" /> }] : []),
    { href: "/account", label: "Account", icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800 flex justify-around items-center h-12 shadow-lg">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center justify-center text-[11px] font-semibold transition-colors px-2 py-1 ${
              active ? "text-lime-400" : "text-white opacity-80 hover:opacity-100"
            }`}
            style={{ minWidth: "48px" }}
          >
            {t.icon}
            <span className="mt-0.5">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}