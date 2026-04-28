import { EMERGENCY_SCENARIOS } from "@/lib/demo-data";
import EmergencyCards from "@/components/EmergencyCards";

/* ─── Decorative section divider ─────────────────────────────────── */
function Divider() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    /* Single consistent dark background for the entire page */
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#09090B" }}
    >

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        {/* Background glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 70% 55% at 50% -10%, rgba(220,38,38,0.22) 0%, transparent 65%)",
              "radial-gradient(ellipse 40% 30% at 80% 60%, rgba(249,115,22,0.10) 0%, transparent 60%)",
            ].join(", "),
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Live badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 border border-red-500/20 bg-red-500/8 text-red-300">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live demo · Los Angeles power outage scenario
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-5 text-white">
            Emergency resources,{" "}
            <br className="hidden sm:block" />
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #EF4444 0%, #F97316 60%, #FBBF24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              found in seconds.
            </span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-in-up-d1 text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            During wildfires, power outages, and heat waves — ReliefRoute finds the
            nearest open shelter, water, charging, Wi-Fi, and medical help ranked
            by trust and availability.
          </p>

          {/* CTA buttons */}
          <div className="animate-fade-in-up-d2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#emergency-select"
              className="inline-flex items-center justify-center gap-2 font-bold px-8 py-3.5 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, #DC2626, #EA580C)",
                boxShadow: "0 0 24px -6px rgba(220,38,38,0.5)",
              }}
            >
              🚨 Select Your Emergency
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 font-medium px-8 py-3.5 rounded-xl text-zinc-300 border border-white/10 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200"
            >
              How it works ↓
            </a>
          </div>

          {/* Trust strip */}
          <div className="animate-fade-in-up-d3 mt-14 flex flex-wrap items-center justify-center gap-8 text-xs text-zinc-500">
            {[
              { icon: "📍", label: "Real-time ArcGIS + NWS data" },
              { icon: "🛡️", label: "Community-verified reports" },
              { icon: "⚡", label: "Instant best-match scoring" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span>{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Emergency selector ─────────────────────────────────────── */}
      <section id="emergency-select" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              What&apos;s your emergency?
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Pick your situation — we&apos;ll open the map pre-filtered to exactly what you need.
            </p>
          </div>

          <EmergencyCards scenarios={EMERGENCY_SCENARIOS} />

          <p className="text-center text-xs text-zinc-600 mt-6">
            Filters are applied automatically — you can adjust them on the map.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-zinc-500 text-sm">
              Three steps from emergency to the right resource.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Select your emergency",
                desc: "Choose your situation — outage, wildfire, heat wave, or flood.",
                icon: "🚨",
                gradient: "from-red-600 to-orange-500",
                glow: "rgba(239,68,68,0.3)",
              },
              {
                step: "02",
                title: "Filter what you need",
                desc: "Power, Wi-Fi, water, shelter, medical — pick what matters most.",
                icon: "🔍",
                gradient: "from-orange-500 to-amber-400",
                glow: "rgba(249,115,22,0.3)",
              },
              {
                step: "03",
                title: "Get the best option",
                desc: "Scored by availability, distance, and real community trust.",
                icon: "✅",
                gradient: "from-amber-400 to-yellow-300",
                glow: "rgba(251,191,36,0.3)",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl border border-white/8 bg-white/3 p-6 flex flex-col gap-4 hover:border-white/15 transition-all duration-300"
              >
                {/* Step number watermark */}
                <div className="absolute top-4 right-4 text-5xl font-black text-white/4 select-none leading-none">
                  {item.step}
                </div>

                {/* Icon bubble with glow */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200`}
                  style={{ boxShadow: `0 8px 24px -6px ${item.glow}` }}
                >
                  {item.icon}
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "8+",        label: "Resources tracked",  gradient: "from-red-500 to-orange-400" },
              { value: "Live",      label: "Community reports",  gradient: "from-orange-400 to-amber-400" },
              { value: "Free",      label: "Always free to use", gradient: "from-amber-400 to-yellow-300" },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div
                  className={`text-4xl sm:text-5xl font-extrabold mb-2 bg-gradient-to-r ${stat.gradient}`}
                  style={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Bottom CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-7 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #DC2626, #EA580C)",
              boxShadow: "0 0 40px -8px rgba(220,38,38,0.5)",
            }}
          >
            🗺️
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            Not sure what you need?
          </h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
            Browse all open resources on the map without any filters — see everything available near you.
          </p>
          <a
            href="#emergency-select"
            className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #DC2626, #EA580C)",
              boxShadow: "0 0 24px -6px rgba(220,38,38,0.4)",
            }}
          >
            Choose your emergency →
          </a>
        </div>
      </section>
    </div>
  );
}
