"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_RESOURCES, EMERGENCY_SCENARIOS, getBestResource } from "@/lib/demo-data";
import ResourceCard from "@/components/ResourceCard";
import ServiceTag, { SERVICE_CONFIG } from "@/components/ServiceTag";
import { ServiceType, ResourceStatus } from "@/types";

const ALL_SERVICES = Object.keys(SERVICE_CONFIG) as ServiceType[];

const STATUS_LABELS: Record<ResourceStatus | "all", string> = {
  all: "All",
  open: "Open",
  limited: "Limited",
  closed: "Closed",
  unknown: "Unknown",
};

function ResourcesContent() {
  const searchParams = useSearchParams();
  const emergencyId = searchParams.get("emergency") ?? "power_outage";

  const scenario =
    EMERGENCY_SCENARIOS.find((s) => s.id === emergencyId) ?? EMERGENCY_SCENARIOS[0];

  const [activeServices, setActiveServices] = useState<ServiceType[]>([]);
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");

  function toggleService(s: ServiceType) {
    setActiveServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const filtered = useMemo(() => {
    return DEMO_RESOURCES.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (activeServices.length > 0) {
        const hasAll = activeServices.every((s) => r.services.includes(s));
        if (!hasAll) return false;
      }
      return true;
    }).sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));
  }, [activeServices, statusFilter]);

  const bestPick = useMemo(() => getBestResource(filtered), [filtered]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{scenario.icon}</span>
            <h1 className="text-xl font-bold text-gray-900">{scenario.label}</h1>
            <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
              Demo · Los Angeles
            </span>
          </div>
          <p className="text-sm text-gray-500">{filtered.length} resources found</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "open", "limited"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Service filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium mr-1">Filter by need:</span>
          {ALL_SERVICES.map((s) => {
            const active = activeServices.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleService(s)}
                className={`transition-all ${
                  active
                    ? "ring-2 ring-gray-900 ring-offset-1 rounded-full"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <ServiceTag service={s} small />
              </button>
            );
          })}
          {activeServices.length > 0 && (
            <button
              onClick={() => setActiveServices([])}
              className="text-xs text-red-600 hover:text-red-800 font-medium ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Best pick callout */}
      {bestPick && (
        <div className="mb-6">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
            ⭐ Top Recommendation
          </div>
          <ResourceCard resource={bestPick} isBestPick />
        </div>
      )}

      {/* All resources grid */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          All Resources
        </h2>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">No resources match your filters.</p>
          <button
            onClick={() => {
              setActiveServices([]);
              setStatusFilter("all");
            }}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} isBestPick={false} />
          ))}
        </div>
      )}

      {/* Score legend */}
      <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          How the recommendation score works
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>40% availability</span>
          <span>25% distance</span>
          <span>20% trust score</span>
          <span>15% service match</span>
        </div>
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
          Loading resources…
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
