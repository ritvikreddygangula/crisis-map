import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import { ReportModel } from "@/models/Report";
import { ResourceModel } from "@/models/Resource";
import type { ResourceStatus, ServiceType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: ResourceStatus[] = ["open", "limited", "closed", "unknown"];
const VALID_CROWD = ["empty", "moderate", "crowded"] as const;

// Minimum reports in the same direction before status flips.
// Set to 1 for instant demo feedback, 2+ for anti-spam.
const MIN_REPORTS_FOR_STATUS_CHANGE = 1;

// How many recent reports to use when computing consensus status and trust score.
const CONSENSUS_WINDOW = 5;

type ReportBody = {
  resourceId?: string;
  userId?: string;
  statusReported?: ResourceStatus;
  servicesAvailable?: ServiceType[];
  crowdLevel?: (typeof VALID_CROWD)[number];
  note?: string;
  // Resource metadata — sent by the frontend so we can create the DB record
  // on first report for resources not yet in MongoDB (Wi-Fi, medical).
  resourceName?: string;
  resourceType?: string;
  resourceAddress?: string;
  resourceLocation?: { lat: number; lng: number };
  resourceServices?: ServiceType[];
};

// Weight each status for trust score purposes.
const STATUS_TRUST_WEIGHT: Record<ResourceStatus, number> = {
  open:    +5,
  limited: -2,
  closed:  -8,
  unknown:  0,
};

function consensusStatus(statuses: ResourceStatus[]): ResourceStatus {
  const counts: Partial<Record<ResourceStatus, number>> = {};
  for (const s of statuses) counts[s] = (counts[s] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ResourceStatus;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReportBody;

    if (!body.resourceId || !body.statusReported) {
      return NextResponse.json(
        { error: "resourceId and statusReported are required" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(body.statusReported)) {
      return NextResponse.json(
        { error: `statusReported must be one of ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();
    const now = new Date().toISOString();

    // 1. Save the report unconditionally.
    await ReportModel.create({
      id: randomUUID(),
      resourceId: body.resourceId,
      userId: body.userId ?? "anonymous",
      statusReported: body.statusReported,
      servicesAvailable: body.servicesAvailable ?? [],
      crowdLevel: body.crowdLevel ?? "moderate",
      note: body.note ?? "",
      createdAt: now,
    });

    // 2. Find the resource. If it doesn't exist yet (Wi-Fi, medical) and the frontend
    //    sent metadata, create a minimal record so this and future reports can update it.
    let resource = await ResourceModel.findOne({ id: body.resourceId });

    if (!resource && body.resourceName && body.resourceLocation) {
      resource = await ResourceModel.create({
        id: body.resourceId,
        name: body.resourceName,
        type: body.resourceType ?? "Resource",
        address: body.resourceAddress ?? "",
        location: body.resourceLocation,
        status: "unknown",
        services: body.resourceServices ?? [],
        capacity: null,
        trustScore: 70,
        lastUpdated: now,
        notes: "",
        recommendationScore: 50,
      });
    }

    let resourceUpdated = false;

    if (resource) {
      // 3. Get last CONSENSUS_WINDOW reports (includes the one we just created).
      const recentReports = await ReportModel.find({ resourceId: body.resourceId })
        .sort({ createdAt: -1 })
        .limit(CONSENSUS_WINDOW)
        .lean();

      const recentStatuses = recentReports.map((r) => r.statusReported as ResourceStatus);

      // 4. Status: flip once MIN_REPORTS_FOR_STATUS_CHANGE reports agree.
      if (recentReports.length >= MIN_REPORTS_FOR_STATUS_CHANGE) {
        resource.status = consensusStatus(recentStatuses);
      }

      // 5. Trust score: weighted average over recent reports, converges rather than drifts.
      //    Baseline 70. Window of 5 reports. Each "open" nudges up, each "closed" pulls down.
      const totalWeight = recentStatuses.reduce(
        (sum, s) => sum + STATUS_TRUST_WEIGHT[s],
        0
      );
      const newScore = 70 + Math.round((totalWeight / recentStatuses.length) * 5);
      resource.trustScore = Math.max(0, Math.min(100, newScore));

      resource.lastUpdated = now;
      await resource.save();
      resourceUpdated = true;
    }

    return NextResponse.json({ success: true, resourceUpdated }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
