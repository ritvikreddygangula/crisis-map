import { NextResponse } from "next/server";
import { Resource, ResourceStatus, ServiceType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEATURE_SERVICE =
  "https://services1.arcgis.com/mpVYz37anSdrK4d8/arcgis/rest/services/AZCoolingandHydration/FeatureServer/19/query";

const QUERY_FIELDS = [
  "OBJECTID",
  "Facility",
  "Organization",
  "HydrationActivities",
  "CollectionActivities",
  "Hydration",
  "Collection",
  "Address",
  "City",
  "Zip",
  "SeasonStatus",
  "Open24seven",
  "PopupHours",
  "Pets",
  "PrimaryPhone",
].join(",");

export async function GET() {
  try {
    // No city filter — the ADHS dataset has sparse Phoenix metro records (seasonal May–Sep).
    // Fetching all AZ to ensure the map has real pins to show.
    const params = new URLSearchParams({
      where: "1=1",
      outFields: QUERY_FIELDS,
      outSR: "4326",
      resultRecordCount: "300",
      f: "json",
    });

    const res = await fetch(`${FEATURE_SERVICE}?${params}`, {
      headers: { "User-Agent": "ReliefRoute/1.0 (vasisht.chinmay@gmail.com)" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ArcGIS request failed: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message ?? "ArcGIS error" },
        { status: 502 }
      );
    }

    const resources: Resource[] = (data.features ?? [])
      .filter((f: ArcGISFeature) => f.geometry)
      .map((f: ArcGISFeature, i: number) => transformFeature(f, i));

    return NextResponse.json(resources);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface ArcGISFeature {
  attributes: Record<string, string | number | null>;
  geometry: { x: number; y: number };
}

function transformFeature(feature: ArcGISFeature, index: number): Resource {
  const a = feature.attributes;
  const geo = feature.geometry;

  const hydAct = String(a.HydrationActivities ?? "").toLowerCase();
  const colAct = String(a.CollectionActivities ?? "").toLowerCase();

  // Resource type
  let type = "Cooling Center";
  if (hydAct.includes("respite")) {
    type = "Respite Center";
  } else if (hydAct.includes("hydration") && !hydAct.includes("cooling")) {
    type = "Hydration Station";
  } else if (!hydAct && a.Collection === "yes") {
    type = "Donation Site";
  }

  // Services
  const services: ServiceType[] = [];
  if (hydAct.includes("cooling") || type === "Cooling Center" || type === "Respite Center") {
    services.push("cooling");
  }
  if (a.Hydration === "yes" || hydAct.includes("hydration") || type === "Hydration Station") {
    if (!services.includes("water")) services.push("water");
  }
  if (a.Collection === "yes" || colAct.includes("water")) {
    if (!services.includes("water")) services.push("water");
  }
  if (colAct.includes("food") || colAct.includes("general")) {
    services.push("food");
  }

  // Status
  const seasonStatus = String(a.SeasonStatus ?? "").toLowerCase();
  let status: ResourceStatus = "unknown";
  if (seasonStatus === "active") status = "open";
  else if (seasonStatus === "inactive") status = "closed";

  // Address
  const street = String(a.Address ?? "").trim();
  const city = String(a.City ?? "").trim();
  const zip = String(a.Zip ?? "").trim();
  const address = [street, city ? `${city}, AZ` : "AZ", zip].filter(Boolean).join(" ").trim();

  // Notes
  const noteParts: string[] = [];
  if (a.Open24seven === "yes") noteParts.push("Open 24/7.");
  else if (a.PopupHours) noteParts.push(`Hours: ${a.PopupHours}.`);
  if (a.Pets === "yes") noteParts.push("Pets welcome.");
  if (a.PrimaryPhone) noteParts.push(`Call: ${a.PrimaryPhone}`);

  // Basic recommendation score (no distance data from ArcGIS)
  const statusScore = status === "open" ? 100 : status === "unknown" ? 40 : 0;
  const serviceScore = Math.min(services.length / 3, 1) * 100;
  const trustScore = 70;
  const recommendationScore = Math.round(statusScore * 0.5 + trustScore * 0.3 + serviceScore * 0.2);

  return {
    id: `arcgis-${a.OBJECTID ?? index}`,
    name: String(a.Facility ?? a.Organization ?? `Resource ${index + 1}`),
    type,
    address,
    location: { lat: geo.y, lng: geo.x },
    status,
    services,
    capacity: null,
    trustScore,
    lastUpdated: new Date().toISOString(),
    notes: noteParts.join(" "),
    recommendationScore,
  };
}
