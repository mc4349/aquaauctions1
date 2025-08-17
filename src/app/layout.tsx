"use client";

import "./globals.css";
import NavBar from "@/components/NavBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-900 text-white font-sans min-h-screen">
        <NavBar />
        <div className="pt-4 pb-24 min-h-screen">{children}</div>
      </body>
    </html>
  );
}