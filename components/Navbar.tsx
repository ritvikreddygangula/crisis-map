import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/15 shadow-sm">
      <div className="w-full px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200"
            style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)" }}
          >
            <span className="text-white text-sm">🗺️</span>
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Relief<span style={{ color: "#DC2626" }}>Route</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            LIVE
          </span>
        </Link>

        {/* Nav actions */}
        <nav className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live data
          </div>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white shadow-sm hover:-translate-y-px hover:shadow-md transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #DC2626, #EA580C)" }}
          >
            Find Help Now
            <span className="text-xs">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
