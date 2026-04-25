"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_RESOURCES, EMERGENCY_SCENARIOS, getBestResource } from "@/lib/demo-data";
import ResourceCard from "@/components/ResourceCard";
import ResourceMap from "@/components/ResourceMap";
import HeatAlertBanner from "@/components/HeatAlertBanner";
import ServiceTag, { SERVICE_CONFIG } from "@/components/ServiceTag";
import { ServiceType, ResourceStatus, Resource } from "@/types";
import type { HeatAlert } from "@/app/api/heat-alerts/route";

const ALL_SERVICES = Object.keys(SERVICE_CONFIG) as ServiceType[];

const STATUS_LABELS: Record<ResourceStatus | "all", string> = {
  all: "All",
  open: "Open",
  limited: "Limited",
  closed: "Closed",
  unknown: "Unknown",
};

const TRUST_OPTIONS: { label: string; value: number }[] = [
  { label: "Any", value: 0 },
  { label: "60+", value: 60 },
  { label: "75+", value: 75 },
  { label: "90+", value: 90 },
];

function ResourcesContent() {
  const searchParams = useSearchParams();
  const emergencyId = searchParams.get("emergency") ?? "heat_wave";

  const scenario =
    EMERGENCY_SCENARIOS.find((s) => s.id === emergencyId) ?? EMERGENCY_SCENARIOS[0];

  const [resources, setResources] = useState<Resource[]>(DEMO_RESOURCES);
  const [loading, setLoading] = useState(true);
  const [heatAlerts, setHeatAlerts] = useState<HeatAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeServices, setActiveServices] = useState<ServiceType[]>([]);
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [minTrust, setMinTrust] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    // Fetch live ArcGIS resources; fall back to demo data on failure
    fetch("/api/arcgis-resources")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setResources(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch NWS heat alerts independently (non-blocking)
    fetch("/api/heat-alerts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHeatAlerts(data);
      })
      .catch(() => {});
  }, []);

  function toggleService(s: ServiceType) {
    setActiveServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleMarkerClick(r: Resource) {
    setSelectedId(r.id);
    setTimeout(() => {
      document
        .getElementById(`card-${r.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function clearAllFilters() {
    setActiveServices([]);
    setStatusFilter("all");
    setTypeFilter("all");
    setMinTrust(0);
  }

  const allTypes = useMemo(
    () => ["all", ...Array.from(new Set(resources.map((r) => r.type)))],
    [resources]
  );

  const filtered = useMemo(() => {
    return resources
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (typeFilter !== "all" && r.type !== typeFilter) return false;
        if (r.trustScore < minTrust) return false;
        if (activeServices.length > 0) {
          if (!activeServices.every((s) => r.services.includes(s))) return false;
        }
        return true;
      })
      .sort(
        (a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0)
      );
  }, [resources, statusFilter, typeFilter, minTrust, activeServices]);

  const bestPick = useMemo(() => getBestResource(filtered), [filtered]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    minTrust > 0 ||
    activeServices.length > 0;

  const isArcGISData = resources.length > 0 && resources[0].id.startsWith("arcgis-");

  return (
    <div>
      {/* NWS heat alert banner — full bleed above page content */}
      <HeatAlertBanner alerts={heatAlerts} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{scenario.icon}</span>
              <h1 className="text-xl font-bold text-gray-900">{scenario.label}</h1>
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {isArcGISData ? "Live · Arizona" : "Demo · Los Angeles"}
              </span>
            </div>
            {loading ? (
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-sm text-gray-500">
                {filtered.length} resource{filtered.length !== 1 ? "s" : ""} found
                {isArcGISData ? " · Statewide Arizona" : ""}
              </p>
            )}
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
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Services:</span>
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

        {/* Type + Trust filters */}
        <div className="mb-5 flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium mr-1">Type:</span>
            {allTypes.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  typeFilter === t
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center sm:ml-auto">
            <span className="text-xs text-gray-500 font-medium mr-1">Trust:</span>
            {TRUST_OPTIONS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setMinTrust(value)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  minTrust === value
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Map — dominant element */}
        <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" />
                Open
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
                Limited
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600" />
                Closed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" />
                Unknown
              </span>
              {loading && (
                <span className="text-gray-400 animate-pulse">Loading live data…</span>
              )}
            </div>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded"
              />
              Heatmap
            </label>
          </div>
          <ResourceMap
            resources={filtered}
            selectedId={selectedId}
            onMarkerClick={handleMarkerClick}
            showHeatmap={showHeatmap}
          />
        </div>

        {/* Best pick callout */}
        {bestPick && (
          <div className="mb-6">
            <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
              ⭐ Top Recommendation
            </div>
            <div id={`card-${bestPick.id}`}>
              <ResourceCard
                resource={bestPick}
                isBestPick
                isSelected={selectedId === bestPick.id}
              />
            </div>
          </div>
        )}

        {/* All resources grid */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            All Resources
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">No resources match your filters.</p>
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((r) => (
              <div key={r.id} id={`card-${r.id}`}>
                <ResourceCard
                  resource={r}
                  isBestPick={false}
                  isSelected={r.id === selectedId}
                />
              </div>
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
