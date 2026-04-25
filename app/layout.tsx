import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({ subsets: ["latin"] });

// hi i am ritvik redddy
export const metadata: Metadata = {
  title: "ReliefRoute – Find Emergency Resources Near You",
  description:
    "Real-time emergency resource heatmap. Find nearby shelters, water, charging, Wi-Fi, and medical help during outages, wildfires, and heat waves.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.className} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
          ReliefRoute · LA Hacks 2026 · Arista &ldquo;Connect the Dots&rdquo; Track
        </footer>
      </body>
    </html>
  );
}
