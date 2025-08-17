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
          {/* Main content container with bottom padding for NavBar */}
          <main className="container mx-auto px-4 pt-4 pb-16 min-h-screen">
            {children}
          </main>
          <NavBar />
        </AuthProvider>
      </body>
    </html>
  );
}