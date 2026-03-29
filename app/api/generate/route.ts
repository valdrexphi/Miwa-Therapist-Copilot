import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildRegenerationPrompt,
  buildUserPrompt,
  draftResponseSchema,
  editingResponseSchema,
  regenerationSchemas,
  systemPrompt,
} from "@/lib/prompt";
import {
  CASE_TYPES,
  NOTE_FORMATS,
  ORIENTATIONS,
  OUTPUT_MODES,
  REGENERATE_TARGETS,
  isCopilotApiError,
  isCopilotApiResponse,
  isCopilotPartialApiResponse,
  type CopilotApiResponse,
  type CopilotFormData,
  type CopilotGenerateRequest,
  type CopilotPartialApiResponse,
  type OutputMode,
  type RegenerateTarget,
} from "@/lib/types";

export const runtime = "nodejs";

// Simple in-memory rate limiter: max 10 requests per IP per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count += 1;
  return true;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T
): value is T[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function isValidRequestBody(body: unknown): body is CopilotFormData {
  if (!body || typeof body !== "object") return false;
  const c = body as Record<string, unknown>;
  return (
    isOneOf(c.caseType, CASE_TYPES) &&
    isOneOf(c.noteFormat, NOTE_FORMATS) &&
    isOneOf(c.outputMode, OUTPUT_MODES) &&
    isOneOf(c.orientation, ORIENTATIONS) &&
    isNonEmptyString(c.presentingProblem) &&
    isNonEmptyString(c.treatmentGoal) &&
    isNonEmptyString(c.sessionNotes)
  );
}

function isValidUploadedContext(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.filename === "string" &&
    typeof c.fileType === "string" &&
    typeof c.text === "string"
  );
}

function isValidGenerateRequest(body: unknown): body is CopilotGenerateRequest {
  if (!isValidRequestBody(body)) return false;
  const c = body as Record<string, unknown>;
  if (!isValidUploadedContext(c.uploadedContext)) return false;
  if (c.regenerateTarget === undefined) return true;
  return isOneOf(c.regenerateTarget, REGENERATE_TARGETS);
}

function isValidRegenerateTarget(
  outputMode: OutputMode,
  target: RegenerateTarget
): boolean {
  const draftTargets = new Set<RegenerateTarget>([
    "birp_note", "interventions", "supervision_questions", "compliance_flags",
    "next_session_focus", "clinical_hypothesis", "diagnostic_considerations", "clarifying_questions",
  ]);
  const editingTargets = new Set<RegenerateTarget>([
    "revised_note", "wording_suggestions", "rationale_for_edits",
    "supervision_questions", "compliance_flags", "diagnostic_considerations", "clarifying_questions",
  ]);
  return outputMode === "draft" ? draftTargets.has(target) : editingTargets.has(target);
}

function trimFormData(body: CopilotGenerateRequest): CopilotGenerateRequest {
  return {
    ...body,
    presentingProblem: body.presentingProblem.trim().slice(0, 2000),
    treatmentGoal: body.treatmentGoal.trim().slice(0, 1000),
    sessionNotes: body.sessionNotes.trim().slice(0, 4000),
    uploadedContext: body.uploadedContext
      ? {
          ...body.uploadedContext,
          text: body.uploadedContext.text.trim().slice(0, 15000),
        }
      : undefined,
  };
}

function getResponseSchema(outputMode: OutputMode) {
  return outputMode === "draft" ? draftResponseSchema : editingResponseSchema;
}

function getRegenerationSchema(outputMode: OutputMode, target: RegenerateTarget) {
  if (outputMode === "draft") {
    return regenerationSchemas.draft[target as keyof typeof regenerationSchemas.draft];
  }
  return regenerationSchemas.editing[target as keyof typeof regenerationSchemas.editing];
}

function parseModelOutput(
  outputText: string,
  outputMode: OutputMode
): CopilotApiResponse | null {
  try {
    const parsed: unknown = JSON.parse(outputText);
    return isCopilotApiResponse(parsed, outputMode) ? parsed : null;
  } catch {
    return null;
  }
}

function parsePartialModelOutput(outputText: string): CopilotPartialApiResponse | null {
  try {
    const parsed: unknown = JSON.parse(outputText);
    return isCopilotPartialApiResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY. Configure it in your environment or Vercel project settings." },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The request body must be valid JSON." },
        { status: 400 }
      );
    }

    if (!isValidGenerateRequest(body)) {
      return NextResponse.json(
        { error: "All form fields are required: case type, note format, output mode, orientation, presenting problem, treatment goal, and session notes." },
        { status: 400 }
      );
    }

    const cleanedBody = trimFormData(body);

    if (
      cleanedBody.regenerateTarget &&
      !isValidRegenerateTarget(cleanedBody.outputMode, cleanedBody.regenerateTarget)
    ) {
      return NextResponse.json(
        { error: "That section cannot be regenerated for the selected output mode." },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const isTargetedRegeneration = Boolean(cleanedBody.regenerateTarget);
    const schema = isTargetedRegeneration && cleanedBody.regenerateTarget
      ? getRegenerationSchema(cleanedBody.outputMode, cleanedBody.regenerateTarget)
      : getResponseSchema(cleanedBody.outputMode);
    const prompt = isTargetedRegeneration && cleanedBody.regenerateTarget
      ? buildRegenerationPrompt(cleanedBody, cleanedBody.regenerateTarget)
      : buildUserPrompt(cleanedBody);

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "clinical_copilot_response",
          strict: true,
          schema,
        },
      },
    });

    if (!response.output_text) {
      return NextResponse.json(
        { error: "The AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    const parsed = isTargetedRegeneration
      ? parsePartialModelOutput(response.output_text)
      : parseModelOutput(response.output_text, cleanedBody.outputMode);

    if (!parsed) {
      return NextResponse.json(
        { error: "The AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (isCopilotApiError(error)) {
      return NextResponse.json(error, { status: 500 });
    }
    console.error("Error in /api/generate:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating the draft. Please try again." },
      { status: 500 }
    );
  }
}
