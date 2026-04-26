import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="text-red-600 text-xl">🗺️</span>
          <span className="text-lg tracking-tight">
            Crisis<span className="text-red-600">Map</span>
          </span>
          <span className="hidden sm:inline-flex items-center ml-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
            LIVE DEMO
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/resources"
            className="text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Find Help Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
