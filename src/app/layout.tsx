"use client";

import "./globals.css";
import NavBar from "@/components/NavBar";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-neutral-900 text-white font-sans min-h-screen">
        <AuthProvider>
          <NavBar />
          <div className="container mx-auto px-4 pt-4 pb-24 min-h-screen">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}