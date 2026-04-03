import { NextResponse } from "next/server";

// Placeholder for Oura API integration
// Will pull sleep/readiness scores and store in daily_scores
export async function GET() {
  // TODO: Implement Oura API pull when OURA_ACCESS_TOKEN is available
  return NextResponse.json({ status: "oura cron placeholder" });
}
