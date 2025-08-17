"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { HomeIcon, VideoCameraIcon, UserIcon, BellIcon } from "@heroicons/react/24/outline"; // Make sure you installed @heroicons/react

export default function NavBar() {
  const pathname = usePathname();
  const { user, loginWithGoogle, logout } = useAuth();

  // Mobile-style bottom tabs
  const tabs = [
    {
      href: "/",
      label: "Home",
      icon: <HomeIcon className="w-6 h-6" />,
    },
    {
      href: "/explore",
      label: "Explore",
      icon: <VideoCameraIcon className="w-6 h-6" />,
    },
    {
      href: "/alerts",
      label: "Alerts",
      icon: <BellIcon className="w-6 h-6" />,
    },
    ...(user ? [{ href: "/stream", label: "Go Live", icon: <VideoCameraIcon className="w-6 h-6" /> }] : []),
    {
      href: "/account",
      label: "Account",
      icon: <UserIcon className="w-6 h-6" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800 flex justify-around items-center py-2 shadow-lg">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center text-xs px-2 py-1 font-semibold ${
              active
                ? "text-lime-400"
                : "text-white opacity-80 hover:opacity-100"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}