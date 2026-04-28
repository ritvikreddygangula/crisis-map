import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ReliefRoute – Find Emergency Resources Near You",
  description:
    "Real-time emergency resource heatmap. Find nearby shelters, water, charging, Wi-Fi, and medical help during outages, wildfires, and heat waves.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/8 py-5 text-center" style={{ background: "#09090B" }}>
          <p className="text-sm text-zinc-500">
            <span className="font-semibold" style={{ color: "#EF4444" }}>ReliefRoute</span>
            {" · "}
            <span className="text-zinc-600">LA Hacks 2026</span>
            {" · "}
            <span className="text-zinc-600">Arista &ldquo;Connect the Dots&rdquo; Track</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
