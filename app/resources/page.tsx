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
  // Pre-apply the needs from the selected emergency scenario so the map
  // arrives filtered to what's actually relevant (shelter+wifi for outages, etc.)
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
          // OR logic: show resources that offer at least one of the selected services.
          // AND would intersect to zero for multi-service emergency presets (e.g. shelter+wifi
          // finds nothing because no single resource offers both).
          if (!activeServices.some((s) => r.services.includes(s))) return false;
        }
        return true;
      })
      .sort(
        (a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0)
      );
  }, [resources, statusFilter, minTrust, activeServices]);

  const listItems = useMemo(() => {
    return filtered.filter((r) => visibleIds.size === 0 || visibleIds.has(r.id));
  }, [filtered, visibleIds]);

  const bestPick = useMemo(() => getBestResource(listItems), [listItems]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    minTrust > 0 ||
    activeServices.length > 0;

  const isArcGISData = resources.some((r) => r.id.startsWith("arcgis-"));

  return (
    <div className="flex flex-col">
      {/* NWS heat alert banner — full bleed above two-column layout */}
      <HeatAlertBanner alerts={heatAlerts} />

      {/* Two-column layout: left = list, right = map */}
      <div
        className="flex flex-col sm:flex-row"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* LEFT COLUMN: filters + list (scrollable) */}
        <div
          className="w-full sm:w-105 shrink-0 flex flex-col overflow-y-auto border-r border-gray-200 bg-white"
          style={{ maxHeight: "calc(100vh - 64px)" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{scenario.icon}</span>
              <h1 className="text-base font-bold text-gray-900">{scenario.label}</h1>
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                {isArcGISData ? "Live · AZ" : "Demo · LA"}
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-gray-100 space-y-3">
            {/* Status filter */}
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1.5">Status</span>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "open"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
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

            {/* Services filter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500 font-medium">Services</span>
                {activeServices.length > 0 && (
                  <button
                    onClick={() => setActiveServices([])}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
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
              </div>
            </div>

            {/* Min. trust filter */}
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1.5">Min. trust</span>
              <div className="flex gap-1">
                {TRUST_OPTIONS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setMinTrust(value)}
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
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
          </div>

          {/* Count row + Show more */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 bg-gray-50">
            {loading ? (
              <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
            ) : (
              <span className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">{listItems.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">{filtered.length}</span>
              </span>
            )}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear filters
                </button>
              )}
              {listItems.length < filtered.length && (
                <button
                  onClick={() => setMapZoom((z) => Math.max(z - 2, 4))}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 transition-colors"
                >
                  Show more
                </button>
              )}
            </div>
          </div>

          {/* Resource list */}
          <div className="flex-1 px-4 py-3 space-y-3">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </>
            ) : listItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-3xl mb-2">🔍</div>
                <p className="font-medium text-sm">No resources match your filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              listItems.map((r) => (
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
              // re-fetch all three APIs to refresh the map
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

        {/* RIGHT COLUMN: map (sticky, fills viewport height) */}
        <div className="flex-1 sticky top-0 h-full flex flex-col min-h-75">
          {/* Map toolbar */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-600" />
                Open
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                Limited
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                Closed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                Unknown
              </span>
              {loading && (
                <span className="text-gray-400 animate-pulse">Loading…</span>
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

          {/* Map fills the rest */}
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
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
          Loading resources…
        </div>
      }
    >
      <ResourcesContent />
    </Suspense>
  );
}
