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

type ReportBody = {
  resourceId?: string;
  userId?: string;
  statusReported?: ResourceStatus;
  servicesAvailable?: ServiceType[];
  crowdLevel?: (typeof VALID_CROWD)[number];
  note?: string;
};

function trustDelta(status: ResourceStatus): number {
  if (status === "open") return 2;
  if (status === "limited") return -1;
  if (status === "closed") return -3;
  return 0;
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
    const report = await ReportModel.create({
      id: randomUUID(),
      resourceId: body.resourceId,
      userId: body.userId ?? "anonymous",
      statusReported: body.statusReported,
      servicesAvailable: body.servicesAvailable ?? [],
      crowdLevel: body.crowdLevel ?? "moderate",
      note: body.note ?? "",
      createdAt: now,
    });

    const resource = await ResourceModel.findOne({ id: body.resourceId });
    if (resource) {
      const delta = trustDelta(body.statusReported);
      resource.trustScore = Math.max(0, Math.min(100, resource.trustScore + delta));
      resource.status = body.statusReported;
      resource.lastUpdated = now;
      await resource.save();
    }

    const reportObj = report.toJSON();
    return NextResponse.json(
      { success: true, report: reportObj, resourceUpdated: !!resource },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
