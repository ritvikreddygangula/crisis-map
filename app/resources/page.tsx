"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { EMERGENCY_SCENARIOS, getBestResource } from "@/lib/demo-data";
import ResourceCard from "@/components/ResourceCard";
import ReportForm from "@/components/ReportForm";
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

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatAlerts, setHeatAlerts] = useState<HeatAlert[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeServices, setActiveServices] = useState<ServiceType[]>(
    () => scenario.defaultNeeds
  );
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
  const [minTrust, setMinTrust] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [mapZoom, setMapZoom] = useState(10);
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [reportingResource, setReportingResource] = useState<Resource | null>(null);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/arcgis-resources").then((r) => r.json()),
      fetch("/api/wifi-resources").then((r) => r.json()),
      fetch("/api/medical-resources").then((r) => r.json()),
    ])
      .then((results) => {
        const merged: Resource[] = [];
        for (const result of results) {
          if (result.status === "fulfilled" && Array.isArray(result.value)) {
            merged.push(...result.value);
          }
        }
        if (merged.length > 0) setResources(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

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
    setMinTrust(0);
  }

  const handleBoundsChanged = useCallback((ids: Set<string>) => {
    setVisibleIds(ids);
  }, []);

  const filtered = useMemo(() => {
    return resources
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (r.trustScore < minTrust) return false;
        if (activeServices.length > 0) {
          if (!activeServices.some((s) => r.services.includes(s))) return false;
        }
        return true;
      })
      .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));
  }, [resources, statusFilter, minTrust, activeServices]);

  const listItems = useMemo(() => {
    return filtered.filter((r) => visibleIds.size === 0 || visibleIds.has(r.id));
  }, [filtered, visibleIds]);

  const bestPick = useMemo(() => getBestResource(listItems), [listItems]);

  const orderedListItems = useMemo(() => {
    if (!bestPick) return listItems;
    return [bestPick, ...listItems.filter((r) => r.id !== bestPick.id)];
  }, [listItems, bestPick]);

  const hasActiveFilters =
    statusFilter !== "all" || minTrust > 0 || activeServices.length > 0;

  const isArcGISData = resources.some((r) => r.id.startsWith("arcgis-"));

  return (
    <div className="flex flex-col">
      <HeatAlertBanner alerts={heatAlerts} />

      <div
        className="flex flex-col sm:flex-row"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* ── LEFT: filters + list ─────────────────────────── */}
        <div
          className="w-full sm:w-105 shrink-0 flex flex-col overflow-y-auto border-r border-slate-200 bg-white custom-scroll"
          style={{ maxHeight: "calc(100vh - 64px)" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                {scenario.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900 truncate">{scenario.label}</h1>
                  <span
                    className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                      isArcGISData
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {isArcGISData ? "Live · AZ" : "Demo · LA"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{scenario.description}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-3.5 border-b border-slate-100 space-y-4 bg-slate-50/50">
            {/* Status filter */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Status
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "open"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150 ${
                      statusFilter === s
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Services filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Services
                </span>
                {activeServices.length > 0 && (
                  <button
                    onClick={() => setActiveServices([])}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SERVICES.map((s) => {
                  const active = activeServices.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleService(s)}
                      className={`transition-all duration-150 ${
                        active
                          ? "ring-2 ring-slate-900 ring-offset-1 rounded-full scale-105"
                          : "opacity-65 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      <ServiceTag service={s} small />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min trust filter */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Min. trust
              </span>
              <div className="flex gap-1.5">
                {TRUST_OPTIONS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setMinTrust(value)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-150 ${
                      minTrust === value
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Count row */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            {loading ? (
              <div className="h-3 w-28 bg-slate-200 rounded-full animate-pulse" />
            ) : (
              <span className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-800">{orderedListItems.length}</span>
                {" of "}
                <span className="font-bold text-slate-800">{filtered.length}</span>
                {" resources"}
              </span>
            )}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                >
                  Clear filters
                </button>
              )}
              {orderedListItems.length < filtered.length && (
                <button
                  onClick={() => setMapZoom((z) => Math.max(z - 2, 4))}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded-full border border-cyan-200 transition-all"
                >
                  Show more
                </button>
              )}
            </div>
          </div>

          {/* Resource list */}
          <div className="flex-1 px-4 py-3.5 space-y-3">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-36 bg-slate-100 rounded-2xl animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </>
            ) : orderedListItems.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-sm text-slate-600">No resources match your filters.</p>
                <p className="text-xs mt-1 mb-4 text-slate-400">Try broadening your search.</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-semibold text-cyan-600 hover:text-cyan-800 underline transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              orderedListItems.map((r) => (
                <div
                  key={r.id}
                  id={`card-${r.id}`}
                  onClick={() => {
                    setSelectedId(r.id);
                    setPanTarget({ lat: r.location.lat, lng: r.location.lng });
                  }}
                >
                  <ResourceCard
                    resource={r}
                    isBestPick={bestPick?.id === r.id}
                    isSelected={r.id === selectedId}
                    isHovered={r.id === hoveredId}
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onReport={() => setReportingResource(r)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report form modal */}
        {reportingResource && (
          <ReportForm
            resource={reportingResource}
            onClose={() => setReportingResource(null)}
            onSuccess={() => {
              setReportingResource(null);
              setLoading(true);
              Promise.allSettled([
                fetch("/api/arcgis-resources").then((r) => r.json()),
                fetch("/api/wifi-resources").then((r) => r.json()),
                fetch("/api/medical-resources").then((r) => r.json()),
              ])
                .then((results) => {
                  const merged: Resource[] = [];
                  for (const result of results) {
                    if (result.status === "fulfilled" && Array.isArray(result.value))
                      merged.push(...result.value);
                  }
                  if (merged.length > 0) setResources(merged);
                })
                .catch(() => {})
                .finally(() => setLoading(false));
            }}
          />
        )}

        {/* ── RIGHT: map ────────────────────────────────────── */}
        <div className="flex-1 sticky top-0 h-full flex flex-col min-h-75">
          {/* Map toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-slate-200 shrink-0 shadow-sm">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {[
                { color: "bg-emerald-500", label: "Open" },
                { color: "bg-amber-500",   label: "Limited" },
                { color: "bg-red-500",     label: "Closed" },
                { color: "bg-slate-400",   label: "Unknown" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
              {loading && (
                <span className="text-slate-400 animate-pulse font-medium">Loading…</span>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none group">
              <div
                className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ${
                  showHeatmap ? "bg-cyan-500" : "bg-slate-200"
                }`}
                style={{ height: "18px" }}
              >
                <div
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200 ${
                    showHeatmap ? "left-4" : "left-0.5"
                  }`}
                />
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="sr-only"
                />
              </div>
              <span className="font-medium">Heatmap</span>
            </label>
          </div>

          {/* Map */}
          <div className="flex-1">
            <ResourceMap
              resources={filtered}
              selectedId={selectedId}
              onMarkerClick={handleMarkerClick}
              showHeatmap={showHeatmap}
              hoveredId={hoveredId}
              onMarkerHover={setHoveredId}
              onBoundsChanged={handleBoundsChanged}
              mapZoom={mapZoom}
              onMapZoomChange={setMapZoom}
              panTarget={panTarget}
            />
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
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse" />
          <span className="text-sm font-medium">Loading resources…</span>
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
