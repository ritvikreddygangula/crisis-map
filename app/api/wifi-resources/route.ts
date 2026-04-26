import { NextResponse } from "next/server";
import { Resource } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIFI_URL =
  "https://maps.phoenix.gov/pub/rest/services/Public/CityWiFiSites_OD/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson";

interface WifiFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, string | number | null>;
}

export async function GET() {
  try {
    const res = await fetch(WIFI_URL, {
      headers: { "User-Agent": "ReliefRoute/1.0 (vasisht.chinmay@gmail.com)" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const features: WifiFeature[] = data.features ?? [];

    const resources: Resource[] = features
      .filter((f) => f.geometry?.coordinates)
      .map((f, i) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;

        const name = String(p.SITE_NAME ?? p.FACILITY_TYPE ?? `Wi-Fi Site ${i + 1}`).trim();
        const street = String(p.ADDRESS ?? "").trim();
        const city = String(p.CITY ?? "Phoenix").trim();
        const zip = String(p.ZIPCODE ?? "").trim();
        const address = [street, city ? `${city}, AZ` : "AZ", zip]
          .filter(Boolean)
          .join(" ")
          .trim();
        const facilityType = String(p.FACILITY_TYPE ?? "").trim();
        const notes = facilityType ? `${facilityType}. Free public Wi-Fi.` : "Free public Wi-Fi.";

        return {
          id: `wifi-${p.OBJECTID ?? i}`,
          name,
          type: "Wi-Fi Hotspot",
          address,
          location: { lat, lng },
          status: "open" as const,
          services: ["wifi" as const],
          capacity: null,
          trustScore: 80,
          lastUpdated: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          notes,
          recommendationScore: 72,
        };
      });

    // Merge community overrides from MongoDB (status, trustScore, lastUpdated).
    // This ensures reports submitted by users are reflected on re-fetch.
    try {
      const { connectDB } = await import("@/lib/mongodb");
      const { ResourceModel } = await import("@/models/Resource");
      await connectDB();

      const ids = resources.map((r) => r.id);
      const dbDocs = await ResourceModel.find({ id: { $in: ids } }).lean();
      const dbMap = new Map(dbDocs.map((d) => [d.id, d]));

      return NextResponse.json(
        resources.map((r) => {
          const db = dbMap.get(r.id);
          if (!db) return r;
          return {
            ...r,
            status: db.status,
            trustScore: db.trustScore,
            lastUpdated: db.lastUpdated,
          };
        })
      );
    } catch {
      // MongoDB unavailable — return raw API data
      return NextResponse.json(resources);
    }
  } catch {
    return NextResponse.json([]);
  }
}
