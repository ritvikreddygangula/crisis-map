"use client";

import Link from "next/link";
import SpotlightCard from "./SpotlightCard";
import ServiceTag from "./ServiceTag";
import { EmergencyScenario } from "@/types";

interface CardMeta {
  spotlight: string;
  glow: string;
  topBorder: string;
  urgency: string;
  urgencyColor: string;
  stat: string;
  statLabel: string;
  bg: string;
}

const CARD_META: Record<string, CardMeta> = {
  power_outage: {
    spotlight: "rgba(251,191,36,0.13)",
    glow: "rgba(251,191,36,0.25)",
    topBorder: "linear-gradient(90deg, #F59E0B, #EF4444)",
    urgency: "High",
    urgencyColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    stat: "24h",
    statLabel: "avg. outage duration",
    bg: "rgba(251,191,36,0.04)",
  },
  wildfire: {
    spotlight: "rgba(249,115,22,0.14)",
    glow: "rgba(249,115,22,0.28)",
    topBorder: "linear-gradient(90deg, #EF4444, #F97316)",
    urgency: "Critical",
    urgencyColor: "text-red-400 bg-red-400/10 border-red-400/20",
    stat: "3km",
    statLabel: "typical evacuation zone",
    bg: "rgba(239,68,68,0.04)",
  },
  heat_wave: {
    spotlight: "rgba(239,68,68,0.13)",
    glow: "rgba(239,68,68,0.25)",
    topBorder: "linear-gradient(90deg, #DC2626, #F97316)",
    urgency: "Critical",
    urgencyColor: "text-red-400 bg-red-400/10 border-red-400/20",
    stat: "47°C",
    statLabel: "peak heat risk threshold",
    bg: "rgba(220,38,38,0.04)",
  },
  flood: {
    spotlight: "rgba(99,102,241,0.13)",
    glow: "rgba(99,102,241,0.25)",
    topBorder: "linear-gradient(90deg, #6366F1, #06B6D4)",
    urgency: "High",
    urgencyColor: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
    stat: "2hr",
    statLabel: "avg. shelter response time",
    bg: "rgba(99,102,241,0.04)",
  },
};

interface Props {
  scenarios: EmergencyScenario[];
}

export default function EmergencyCards({ scenarios }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {scenarios.map((scenario, i) => {
        const meta = CARD_META[scenario.id] ?? CARD_META.power_outage;

        return (
          <Link
            key={scenario.id}
            href={`/resources?emergency=${scenario.id}`}
            className="block group focus:outline-none"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <SpotlightCard
              spotlightColor={meta.spotlight}
              className={[
                "h-full rounded-2xl border border-white/8 transition-all duration-300",
                "hover:border-white/20 hover:shadow-2xl",
              ].join(" ")}
              style={{ background: "rgba(255,255,255,0.03)" } as React.CSSProperties}
            >
              {/* Top gradient border */}
              <div
                aria-hidden
                className="absolute top-0 left-0 right-0 h-px rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: meta.topBorder }}
              />

              {/* Outer glow on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  boxShadow: `0 0 40px -12px ${meta.glow}`,
                }}
              />

              <div className="relative p-6 flex flex-col gap-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  {/* Icon bubble */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{
                      background: meta.bg,
                      border: `1px solid ${meta.glow}`,
                      boxShadow: `0 0 20px -4px ${meta.glow}`,
                    }}
                  >
                    {scenario.icon}
                  </div>

                  {/* Urgency badge */}
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border tracking-wide ${meta.urgencyColor}`}
                  >
                    {meta.urgency}
                  </span>
                </div>

                {/* Title + description */}
                <div>
                  <h3 className="text-base font-bold text-white leading-tight mb-1.5 group-hover:text-white/90">
                    {scenario.label}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                {/* Service tags */}
                <div className="flex flex-wrap gap-1.5">
                  {scenario.defaultNeeds.map((need) => (
                    <ServiceTag key={need} service={need} small />
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/6" />

                {/* Footer stat + CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className="text-lg font-extrabold"
                      style={{ background: meta.topBorder, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                    >
                      {meta.stat}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">{meta.statLabel}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 group-hover:text-white transition-colors duration-200">
                    <span>Find help</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </Link>
        );
      })}
    </div>
  );
}
