import type { CopilotFormData, RegenerateTarget } from "@/lib/types";

export const systemPrompt = `
You are an AI clinical copilot for therapists and trainees only.
You are not a therapist, and you are not providing direct care to clients.

Your role is to support documentation drafting, therapist reflection, and supervision preparation.

Core rules:
- Do not diagnose unless diagnosis information is explicitly provided in the input.
- Do not make up facts, history, symptoms, quotes, risk details, or events.
- Treat all notes as incomplete and provisional.
- Use a neutral, professional tone suitable for therapist review.
- Prefer precise, conservative wording over polished but unsupported wording.
- Avoid absolute claims, inflated certainty, or clinical overstatement.
- If notes are sparse, write conservatively rather than filling gaps.
- Use subtle uncertainty language when information is limited: "based on available information," "this may reflect," "consider whether."
- Identify the most clinically important dynamic and let it guide prioritization.
- Distinguish clearly between what was reported, what was observed, what the therapist did, and what is a tentative hypothesis.
- Do not introduce named techniques or modality-specific interventions unless clearly supported by the input.
- Let the chosen therapeutic orientation shape language, priorities, and intervention style rather than serving as a label only.
- For couple and family cases, favor relational and systemic framing when supported by the notes.
- For trauma and avoidance presentations, prioritize concrete session-process language: pacing, shutdown, numbing, noticing cues, withdrawal, regulation, manageable engagement.
- Diagnostic support must remain therapist-facing, tentative, and non-definitive.
- Frame all diagnostic possibilities as hypotheses to consider, never confirmed diagnoses.
- Keep diagnostic reasoning evidence-based, concise, and disciplined.
- Supervision support should sound like a thoughtful supervisor challenging formulation, therapist positioning, sequencing, and documentation judgment.
- Supervision questions should be sharp, specific, case-tied, and willing to surface tension, bias, blind spots, overreach, underreach, or sequencing problems.
- In Editing Mode, preserve as much of the therapist's original wording as possible.
- In Editing Mode, avoid replacing the therapist's voice with polished AI language.

ICD-10 coding rules:
- Suggest ICD-10-CM codes only as clinical hypotheses to consider, not confirmed diagnoses.
- Use current ICD-10-CM format (e.g., F41.1 for Generalized Anxiety Disorder).
- Base code suggestions only on information explicitly present in the notes.
- Always accompany each code with a brief rationale tied to the case material.
- Do not suggest codes for conditions not represented in the provided notes.
- Frame ICD-10 suggestions as "codes to consider pending further assessment" rather than assigned diagnoses.
- Include 1 to 3 codes per diagnostic consideration, ordered by relevance to the provided material.
`.trim();

const orientationInstructions: Record<string, string> = {
  Structural: "Emphasize hierarchy, boundaries, subsystems, and alliances.",
  Bowenian: "Emphasize differentiation, emotional process, triangles, reactivity, and multigenerational patterns.",
  "Solution-Focused": "Emphasize exceptions, strengths, resources, and realistic next-step movement.",
  "Trauma-Focused": "Use pacing, regulation, cue-tracking, and avoidance-sensitive language.",
  Strategic: "Emphasize repetitive sequences, attempted solutions, and leverage points.",
  Narrative: "Emphasize problem descriptions, meaning-making, preferred responses, and unique outcomes.",
  "EFT": "Emphasize bonding needs, emotional process, responsiveness, protest, and withdrawal patterns.",
  "Attachment-Based": "Emphasize bonding needs, emotional process, responsiveness, protest, and withdrawal patterns.",
  CBT: "Emphasize triggers, coping, skills, and observable responses.",
  DBT: "Emphasize triggers, coping, skills use, and observable responses.",
  "Motivational Interviewing": "Emphasize ambivalence, change talk, collaboration, and readiness.",
  Psychodynamic: "Emphasize recurring themes, defenses, affect, and relational meaning.",
};

function getOrientationInstruction(orientation: string): string {
  return orientationInstructions[orientation] ?? "Apply an integrative lens informed by the stated orientation.";
}

function buildSharedContext(input: CopilotFormData) {
  return `
Case type: ${input.caseType}
Note format: ${input.noteFormat}
Output mode: ${input.outputMode}
Therapeutic orientation: ${input.orientation}
Orientation guidance: ${getOrientationInstruction(input.orientation)}
Presenting problem: ${input.presentingProblem}
Treatment goal: ${input.treatmentGoal}
Session bullet notes:
${input.sessionNotes}
  `.trim();
}

const icd10CodeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    code: {
      type: "string",
      description: "ICD-10-CM code in standard format, e.g. F41.1",
    },
    description: {
      type: "string",
      description: "Official ICD-10-CM descriptor for this code.",
    },
    rationale: {
      type: "string",
      description: "Brief case-specific rationale for why this code is being considered.",
    },
  },
  required: ["code", "description", "rationale"],
} as const;

const diagnosticConsiderationItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    diagnosis_to_consider: {
      type: "string",
      description: "A tentative diagnosis label framed as a hypothesis, not a confirmed diagnosis.",
    },
    supported_by: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description: "Evidence from the case material that supports considering this diagnosis.",
    },
    missing_information: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description: "Key diagnostic information still missing from the provided material.",
    },
    rule_out_or_competing_considerations: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description: "Important rule-out or competing explanations that still need clarification.",
    },
    icd10_codes: {
      type: "array",
      items: icd10CodeSchema,
      minItems: 1,
      maxItems: 3,
      description: "ICD-10-CM codes to consider, ordered by relevance. Frame as hypotheses pending further assessment.",
    },
  },
  required: [
    "diagnosis_to_consider",
    "supported_by",
    "missing_information",
    "rule_out_or_competing_considerations",
    "icd10_codes",
  ],
} as const;

export const draftResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    birp_note: {
      type: "string",
      description: "A concise, clinician-like note draft in the selected format (BIRP, SOAP, or DAP).",
    },
    interventions: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 3,
    },
    supervision_questions: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 4,
    },
    compliance_flags: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
    },
    next_session_focus: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
    },
    clinical_hypothesis: {
      type: "string",
    },
    diagnostic_considerations: {
      type: "array",
      items: diagnosticConsiderationItemSchema,
      minItems: 2,
      maxItems: 4,
    },
    clarifying_questions: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 8,
    },
  },
  required: [
    "birp_note",
    "interventions",
    "supervision_questions",
    "compliance_flags",
    "next_session_focus",
    "clinical_hypothesis",
    "diagnostic_considerations",
    "clarifying_questions",
  ],
} as const;

export const editingResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    revised_note: {
      type: "string",
      description: "A lightly edited, chart-ready version of the therapist's original wording.",
    },
    wording_suggestions: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    rationale_for_edits: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 6,
    },
    supervision_questions: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 4,
    },
    compliance_flags: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
    },
    diagnostic_considerations: {
      type: "array",
      items: diagnosticConsiderationItemSchema,
      minItems: 2,
      maxItems: 4,
    },
    clarifying_questions: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 8,
    },
  },
  required: [
    "revised_note",
    "wording_suggestions",
    "rationale_for_edits",
    "supervision_questions",
    "compliance_flags",
    "diagnostic_considerations",
    "clarifying_questions",
  ],
} as const;

// --- User prompts ---

function buildDraftModePrompt(input: CopilotFormData): string {
  return `
Generate structured JSON for a therapist-facing clinical copilot.

${buildSharedContext(input)}

Return JSON matching the provided schema exactly.

Note (birp_note field):
- Match the selected format exactly (BIRP = B/I/R/P, SOAP = S/O/A/P, DAP = D/A/P). The field is always called birp_note for schema compatibility.
- Keep concise, clinician-like, and natural. Avoid stiff or overly formal phrasing.
- Stay grounded in the provided information only. Do not add MSE, risk, diagnosis, or history unless explicitly provided.
- Distinguish clearly between what was reported, what was observed, what the therapist did, and what is a tentative hypothesis.
- Let the highest-priority issue organize the note.

Interventions:
- 2 to 3, one sentence each, practical, orientation-consistent.
- The first should address the primary clinical issue. At least one should target the key systemic or relational dynamic.

Supervision questions:
- 3 to 4, sharp and case-specific — not generic prompts.
- Cover: (1) formulation, (2) therapist positioning or bias, (3) intervention sequencing, (4) documentation judgment when relevant.
- At least one must address prioritization or what should come first clinically.

Compliance flags:
- 1 to 3, phrased as cautious chart-review prompts ("Consider clarifying…", "Document whether…").

Next session focus:
- 2 to 4 bullet points, case-tied, realistic for one session. First point addresses the primary issue.

Clinical hypothesis:
- 2 to 4 sentences, tentative, grounded in the input only. Use qualifiers: "this may reflect," "based on available information."

Diagnostic considerations:
- 2 to 4 items.
- For each: provide supported_by, missing_information, rule_out_or_competing_considerations (each 1–3 bullets), and icd10_codes (1–3 codes).
- ICD-10 codes must be current ICD-10-CM codes with code, official description, and a brief case-specific rationale.
- Frame all diagnoses and codes as hypotheses to consider pending further assessment. Do not invent symptoms.

Clarifying questions:
- 4 to 8 targeted, therapist-facing questions focused on duration, severity, impairment, rule-outs, and missing symptom clusters.
- Aim to discriminate between competing explanations, not just gather more of the same type.
`.trim();
}

function buildEditingModePrompt(input: CopilotFormData): string {
  return `
Generate structured JSON for a therapist-facing clinical copilot in Editing Mode.

${buildSharedContext(input)}

Return JSON matching the provided schema exactly.

Revised note:
- Lightly edited, chart-ready version of the therapist's original wording.
- Preserve the therapist's wording, sequence, and specificity. Make only modest improvements for clarity, professionalism, and chart-readiness.
- Do not rewrite everything into polished AI language.
- Do not add new content not present in the input.

Wording suggestions:
- 3 to 6 practical coaching suggestions phrased for the therapist.

Rationale for edits:
- 3 to 6 brief explanations covering clarity, supportability, specificity, or linkage.

Supervision questions:
- 3 to 4, coaching-oriented, tied to documentation judgment, prioritization, and therapist wording choices.
- Cover: (1) formulation, (2) therapist positioning or bias, (3) intervention sequencing, (4) documentation judgment.

Compliance flags:
- 1 to 3, phrased as practical chart-review prompts.

Diagnostic considerations:
- 2 to 4 items with supported_by, missing_information, rule_out_or_competing_considerations, and icd10_codes.
- ICD-10 codes must be current ICD-10-CM format with code, official description, and brief case-specific rationale.
- Frame everything as hypotheses to consider. Do not invent symptoms.

Clarifying questions:
- 4 to 8 targeted therapist-facing questions to help narrow the differential.
`.trim();
}

export function buildUserPrompt(input: CopilotFormData): string {
  return input.outputMode === "editing"
    ? buildEditingModePrompt(input)
    : buildDraftModePrompt(input);
}

// --- Regeneration prompts ---

function buildDraftRegenerationPrompt(
  input: CopilotFormData,
  target: RegenerateTarget
): string {
  const ctx = buildSharedContext(input);

  const specs: Partial<Record<RegenerateTarget, string>> = {
    birp_note: `Regenerate only the note section (birp_note key).
- Match the selected format (BIRP/SOAP/DAP). Stay grounded in provided information only.
- Concise, clinician-like. Distinguish reported vs observed vs hypothesis.
- Let the highest-priority issue organize the note.`,

    interventions: `Regenerate only the interventions (interventions key).
- 2 to 3, one sentence each, orientation-consistent.
- First addresses the primary issue. At least one targets the key systemic or relational dynamic.`,

    supervision_questions: `Regenerate only the supervision questions (supervision_questions key).
- 3 to 4, sharp and case-specific.
- Cover: (1) formulation, (2) therapist positioning/bias, (3) intervention sequencing, (4) documentation judgment.
- At least one must address prioritization or sequencing.`,

    compliance_flags: `Regenerate only the compliance flags (compliance_flags key).
- 1 to 3, phrased as cautious chart-review prompts.`,

    next_session_focus: `Regenerate only the next session focus (next_session_focus key).
- 2 to 4 bullet points, case-tied, realistic for one session.`,

    clinical_hypothesis: `Regenerate only the clinical hypothesis (clinical_hypothesis key).
- 2 to 4 sentences, tentative, grounded in the input. Use qualifiers where appropriate.`,

    diagnostic_considerations: `Regenerate only the diagnostic considerations (diagnostic_considerations key).
- 2 to 4 items with supported_by, missing_information, rule_out_or_competing_considerations, and icd10_codes.
- ICD-10 codes: current ICD-10-CM format, 1–3 per item, with code, description, and case-specific rationale.
- Frame as hypotheses to consider. Do not invent symptoms.`,

    clarifying_questions: `Regenerate only the clarifying questions (clarifying_questions key).
- 4 to 8 targeted, therapist-facing questions.
- Focus on duration, severity, impairment, rule-outs, and discriminating between competing explanations.`,
  };

  const spec = specs[target] ?? specs.compliance_flags!;

  return `Regenerate one section for this therapist-facing clinical copilot.

${ctx}

${spec}

Return JSON with only the relevant key. Do not invent facts.`.trim();
}

function buildEditingRegenerationPrompt(
  input: CopilotFormData,
  target: RegenerateTarget
): string {
  const ctx = buildSharedContext(input);

  const specs: Partial<Record<RegenerateTarget, string>> = {
    revised_note: `Regenerate only the revised note (revised_note key).
- Preserve the therapist's original wording. Light edits for clarity and chart-readiness only.`,

    wording_suggestions: `Regenerate only the wording suggestions (wording_suggestions key).
- 3 to 6 practical, coaching-oriented suggestions for the therapist.`,

    rationale_for_edits: `Regenerate only the rationale for edits (rationale_for_edits key).
- 3 to 6 brief explanations: clarity, supportability, specificity, or linkage.`,

    supervision_questions: `Regenerate only the supervision questions (supervision_questions key).
- 3 to 4, coaching-oriented and tied to documentation judgment.
- Cover: (1) formulation, (2) therapist positioning/bias, (3) sequencing, (4) documentation judgment.`,

    compliance_flags: `Regenerate only the compliance flags (compliance_flags key).
- 1 to 3, coaching-oriented chart-review prompts.`,

    diagnostic_considerations: `Regenerate only the diagnostic considerations (diagnostic_considerations key).
- 2 to 4 items with supported_by, missing_information, rule_out_or_competing_considerations, and icd10_codes.
- ICD-10 codes: current ICD-10-CM format, 1–3 per item, with code, description, and case-specific rationale.
- Frame as hypotheses. Do not invent symptoms.`,

    clarifying_questions: `Regenerate only the clarifying questions (clarifying_questions key).
- 4 to 8 targeted, therapist-facing questions to help narrow the differential.`,
  };

  const spec = specs[target] ?? specs.compliance_flags!;

  return `Regenerate one section for Editing Mode.

${ctx}

${spec}

Return JSON with only the relevant key. Do not invent facts.`.trim();
}

export function buildRegenerationPrompt(
  input: CopilotFormData,
  target: RegenerateTarget
): string {
  return input.outputMode === "editing"
    ? buildEditingRegenerationPrompt(input, target)
    : buildDraftRegenerationPrompt(input, target);
}

// --- Regeneration schemas ---

export const regenerationSchemas = {
  draft: {
    birp_note: {
      type: "object",
      additionalProperties: false,
      properties: { birp_note: draftResponseSchema.properties.birp_note },
      required: ["birp_note"],
    },
    interventions: {
      type: "object",
      additionalProperties: false,
      properties: { interventions: draftResponseSchema.properties.interventions },
      required: ["interventions"],
    },
    supervision_questions: {
      type: "object",
      additionalProperties: false,
      properties: { supervision_questions: draftResponseSchema.properties.supervision_questions },
      required: ["supervision_questions"],
    },
    compliance_flags: {
      type: "object",
      additionalProperties: false,
      properties: { compliance_flags: draftResponseSchema.properties.compliance_flags },
      required: ["compliance_flags"],
    },
    next_session_focus: {
      type: "object",
      additionalProperties: false,
      properties: { next_session_focus: draftResponseSchema.properties.next_session_focus },
      required: ["next_session_focus"],
    },
    clinical_hypothesis: {
      type: "object",
      additionalProperties: false,
      properties: { clinical_hypothesis: draftResponseSchema.properties.clinical_hypothesis },
      required: ["clinical_hypothesis"],
    },
    diagnostic_considerations: {
      type: "object",
      additionalProperties: false,
      properties: { diagnostic_considerations: draftResponseSchema.properties.diagnostic_considerations },
      required: ["diagnostic_considerations"],
    },
    clarifying_questions: {
      type: "object",
      additionalProperties: false,
      properties: { clarifying_questions: draftResponseSchema.properties.clarifying_questions },
      required: ["clarifying_questions"],
    },
  },
  editing: {
    revised_note: {
      type: "object",
      additionalProperties: false,
      properties: { revised_note: editingResponseSchema.properties.revised_note },
      required: ["revised_note"],
    },
    wording_suggestions: {
      type: "object",
      additionalProperties: false,
      properties: { wording_suggestions: editingResponseSchema.properties.wording_suggestions },
      required: ["wording_suggestions"],
    },
    rationale_for_edits: {
      type: "object",
      additionalProperties: false,
      properties: { rationale_for_edits: editingResponseSchema.properties.rationale_for_edits },
      required: ["rationale_for_edits"],
    },
    supervision_questions: {
      type: "object",
      additionalProperties: false,
      properties: { supervision_questions: editingResponseSchema.properties.supervision_questions },
      required: ["supervision_questions"],
    },
    compliance_flags: {
      type: "object",
      additionalProperties: false,
      properties: { compliance_flags: editingResponseSchema.properties.compliance_flags },
      required: ["compliance_flags"],
    },
    diagnostic_considerations: {
      type: "object",
      additionalProperties: false,
      properties: { diagnostic_considerations: editingResponseSchema.properties.diagnostic_considerations },
      required: ["diagnostic_considerations"],
    },
    clarifying_questions: {
      type: "object",
      additionalProperties: false,
      properties: { clarifying_questions: editingResponseSchema.properties.clarifying_questions },
      required: ["clarifying_questions"],
    },
  },
} as const;
