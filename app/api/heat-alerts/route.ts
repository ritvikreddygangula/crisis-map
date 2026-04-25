import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NWS_ALERTS_URL = "https://api.weather.gov/alerts/active";

const HEAT_EVENTS = new Set([
  "Excessive Heat Warning",
  "Excessive Heat Watch",
  "Heat Advisory",
  "Heat Wave Warning",
]);

export interface HeatAlert {
  id: string;
  event: string;
  headline: string;
  severity: string;
  urgency: string;
  expires: string | null;
  description: string;
}

export async function GET() {
  try {
    const res = await fetch(`${NWS_ALERTS_URL}?area=AZ&status=actual`, {
      headers: {
        "User-Agent": "ReliefRoute/1.0 (vasisht.chinmay@gmail.com)",
        Accept: "application/geo+json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();

    const alerts: HeatAlert[] = (data.features ?? [])
      .filter((f: NWSFeature) => HEAT_EVENTS.has(f.properties?.event))
      .map((f: NWSFeature) => ({
        id: f.id ?? f.properties.id,
        event: f.properties.event,
        headline: f.properties.headline ?? f.properties.event,
        severity: f.properties.severity ?? "Unknown",
        urgency: f.properties.urgency ?? "Unknown",
        expires: f.properties.expires ?? null,
        description: (f.properties.description ?? "").slice(0, 400),
      }));

    return NextResponse.json(alerts);
  } catch {
    // Non-critical — return empty array rather than crashing the page
    return NextResponse.json([]);
  }
}

interface NWSFeature {
  id: string;
  properties: {
    id: string;
    event: string;
    headline: string | null;
    severity: string | null;
    urgency: string | null;
    expires: string | null;
    description: string | null;
  };
}
