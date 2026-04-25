import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResourceModel } from "@/models/Resource";
import { DEMO_RESOURCES } from "@/lib/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await connectDB();
    await ResourceModel.deleteMany({});
    const inserted = await ResourceModel.insertMany(DEMO_RESOURCES);
    return NextResponse.json({
      success: true,
      inserted: inserted.length,
      ids: inserted.map((r) => r.id),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    hint: "POST to this endpoint to (re)seed the resources collection from lib/demo-data.ts.",
  });
}
