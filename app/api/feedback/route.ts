import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type FeedbackPayload = {
  rating: string;
  strongestSection: string;
  comments: string;
  outputMode: string;
  noteFormat: string;
  caseType: string;
  orientation: string;
  createdAt: string;
};

function isValidFeedback(body: unknown): body is FeedbackPayload {
  if (!body || typeof body !== "object") return false;
  const c = body as Record<string, unknown>;
  return (
    typeof c.rating === "string" &&
    typeof c.strongestSection === "string" &&
    typeof c.comments === "string" &&
    typeof c.outputMode === "string" &&
    typeof c.noteFormat === "string" &&
    typeof c.caseType === "string" &&
    typeof c.orientation === "string" &&
    typeof c.createdAt === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    if (!isValidFeedback(body)) {
      return NextResponse.json({ error: "Invalid feedback payload." }, { status: 400 });
    }

    // Log to server console — replace with a database write or webhook in production
    console.log("[feedback]", JSON.stringify(body));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/feedback:", error);
    return NextResponse.json(
      { error: "Failed to record feedback." },
      { status: 500 }
    );
  }
}
