import { getSkillGraph } from "@/lib/buildmate-data";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(getSkillGraph());
}
