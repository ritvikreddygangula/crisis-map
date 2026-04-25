import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ResourceModel } from "@/models/Resource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const resources = await ResourceModel.find({}).lean();
    const cleaned = resources.map((r) => {
      const { _id, ...rest } = r as typeof r & { _id: unknown };
      void _id;
      return rest;
    });
    return NextResponse.json(cleaned);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
