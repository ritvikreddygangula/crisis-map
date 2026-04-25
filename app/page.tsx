import Link from "next/link";
import { EMERGENCY_SCENARIOS } from "@/lib/demo-data";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-700 via-red-600 to-orange-500 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live demo · Los Angeles power outage scenario
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Find emergency resources<br />
            <span className="text-orange-200">near you — right now.</span>
          </h1>

          <p className="text-lg text-red-100 mb-8 max-w-xl mx-auto">
            During wildfires, power outages, and heat waves, ReliefRoute connects
            you to the nearest open shelter, water station, charging spot, Wi-Fi,
            and medical help — ranked by trust and availability.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/resources"
              className="inline-flex items-center justify-center gap-2 bg-white text-red-700 font-semibold px-8 py-3 rounded-xl hover:bg-red-50 transition-colors text-base"
            >
              🗺️ View Resources Near Me
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-xl transition-colors text-base"
            >
              How it works ↓
            </a>
          </div>
        </div>
      </section>

      {/* Emergency type selector */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            What&apos;s the emergency?
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            Select your situation and we&apos;ll show the most relevant resources.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EMERGENCY_SCENARIOS.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/resources?emergency=${scenario.id}`}
                className="group flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl p-5 hover:border-red-400 hover:shadow-md transition-all text-center"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform inline-block">
                  {scenario.icon}
                </span>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{scenario.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                    {scenario.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How it works
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Select your emergency",
                desc: "Choose what you're dealing with — outage, wildfire, heat, or flood.",
                icon: "🚨",
              },
              {
                step: "2",
                title: "Filter what you need",
                desc: "Power, Wi-Fi, water, shelter, medical help — pick what matters most.",
                icon: "🔍",
              },
              {
                step: "3",
                title: "Get the best option",
                desc: "ReliefRoute scores resources by availability, distance, and community trust.",
                icon: "✅",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 text-2xl mb-4">
                  {item.icon}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-bold text-red-600 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center">
                    {item.step}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: "8+", label: "Resources tracked" },
              { value: "Real-time", label: "Community reports" },
              { value: "Free", label: "Always free to use" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-white text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Ready to find help?
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Browse all emergency resources in the Los Angeles demo scenario.
        </p>
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-base"
        >
          View All Resources →
        </Link>
      </section>
    </div>
  );
}
