import { NextResponse } from "next/server";
import { Resource } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Phoenix / Tempe / Scottsdale bounding box (sw lat, sw lng, ne lat, ne lng)
const OVERPASS_QUERY = `
[out:json][timeout:15];
(
  node["amenity"~"hospital|clinic|doctors"](33.2,-112.4,33.8,-111.5);
  way["amenity"~"hospital|clinic|doctors"](33.2,-112.4,33.8,-111.5);
);
out center 80;
`.trim();

interface OsmElement {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function amenityToType(amenity: string): string {
  if (amenity === "hospital") return "Hospital";
  if (amenity === "doctors") return "Doctor's Office";
  return "Clinic";
}

export async function GET() {
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ReliefRoute/1.0 (vasisht.chinmay@gmail.com)",
      },
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      next: { revalidate: 86400 },
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const elements: OsmElement[] = data.elements ?? [];

    const resources: Resource[] = elements
      .filter((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        return lat !== undefined && lon !== undefined && el.tags?.name;
      })
      .map((el) => {
        const tags = el.tags ?? {};
        const lat = (el.lat ?? el.center!.lat)!;
        const lng = (el.lon ?? el.center!.lon)!;

        const number = tags["addr:housenumber"] ?? "";
        const street = tags["addr:street"] ?? "";
        const city = tags["addr:city"] ?? "";
        const zip = tags["addr:postcode"] ?? "";
        const addressLine = [number && street ? `${number} ${street}` : street, city ? `${city}, AZ` : "AZ", zip]
          .filter(Boolean)
          .join(" ")
          .trim();

        const noteParts: string[] = [];
        if (tags.opening_hours) noteParts.push(`Hours: ${tags.opening_hours}.`);
        if (tags.phone) noteParts.push(`Phone: ${tags.phone}.`);

        const amenity = tags.amenity ?? "clinic";
        const statusScore = 40; // unknown
        const trustScore = 65;
        const serviceScore = 33;
        const recommendationScore = Math.round(
          statusScore * 0.5 + trustScore * 0.3 + serviceScore * 0.2
        );

        return {
          id: `osm-${el.id}`,
          name: tags.name ?? "Medical Facility",
          type: amenityToType(amenity),
          address: addressLine || "Phoenix, AZ",
          location: { lat, lng },
          status: "unknown" as const,
          services: ["medical" as const],
          capacity: null,
          trustScore,
          lastUpdated: new Date().toISOString(),
          notes: noteParts.join(" "),
          recommendationScore,
        };
      });

    return NextResponse.json(resources);
  } catch {
    return NextResponse.json([]);
  }
}
