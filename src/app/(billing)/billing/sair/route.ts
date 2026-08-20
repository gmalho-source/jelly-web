import { NextResponse, type NextRequest } from "next/server";
import { endSession } from "@/lib/billing/session";
import { billingUrl } from "@/lib/billing/urls";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await endSession();
  return NextResponse.redirect(billingUrl(request, "/"), { status: 303 });
}
