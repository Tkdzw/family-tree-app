import { NextRequest, NextResponse } from "next/server";
import { findConnection } from "@/lib/relationships";

export async function GET(req: NextRequest) {
  const a = req.nextUrl.searchParams.get("a");
  const b = req.nextUrl.searchParams.get("b");

  if (!a || !b) {
    return NextResponse.json({ error: "Both 'a' and 'b' person ids are required." }, { status: 400 });
  }

  const result = await findConnection(a, b);
  if (!result) {
    return NextResponse.json({ error: "No path found between those two people." }, { status: 404 });
  }

  return NextResponse.json(result);
}
