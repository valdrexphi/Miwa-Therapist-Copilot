export const CASE_TYPES = ["individual", "couple", "family"] as const;

export const ORIENTATIONS = [
  "MFT/Systemic",
  "Structural",
  "Bowenian",
  "Strategic",
  "Solution-Focused",
  "Narrative",
  "EFT",
  "CBT",
  "DBT",
  "Trauma-Focused",
  "Psychodynamic",
  "Attachment-Based",
  "Motivational Interviewing",
  "Integrative / Other",
] as const;

export const NOTE_FORMATS = ["BIRP", "SOAP", "DAP"] as const;
export const OUTPUT_MODES = ["draft", "editing"] as const;
export const REGENERATE_TARGETS = [
  "birp_note",
  "interventions",
  "supervision_questions",
  "compliance_flags",
  "next_session_focus",
  "clinical_hypothesis",
  "diagnostic_considerations",
  "clarifying_questions",
  "revised_note",
  "wording_suggestions",
  "rationale_for_edits",
] as const;

export type CaseType = (typeof CASE_TYPES)[number];
export type Orientation = (typeof ORIENTATIONS)[number];
export type NoteFormat = (typeof NOTE_FORMATS)[number];
export type OutputMode = (typeof OUTPUT_MODES)[number];
export type RegenerateTarget = (typeof REGENERATE_TARGETS)[number];

export type CopilotFormData = {
  caseType: CaseType | "";
  noteFormat: NoteFormat;
  outputMode: OutputMode;
  orientation: Orientation | "";
  presentingProblem: string;
  treatmentGoal: string;
  sessionNotes: string;
};

export type ICD10Code = {
  code: string;
  description: string;
  rationale: string;
};

export type DiagnosticConsideration = {
  diagnosis_to_consider: string;
  supported_by: string[];
  missing_information: string[];
  rule_out_or_competing_considerations: string[];
  icd10_codes: ICD10Code[];
};

export type DraftCopilotApiResponse = {
  birp_note: string;
  interventions: string[];
  supervision_questions: string[];
  compliance_flags: string[];
  next_session_focus: string[];
  clinical_hypothesis: string;
  diagnostic_considerations: DiagnosticConsideration[];
  clarifying_questions: string[];
};

export type EditingCopilotApiResponse = {
  revised_note: string;
  wording_suggestions: string[];
  rationale_for_edits: string[];
  supervision_questions: string[];
  compliance_flags: string[];
  diagnostic_considerations: DiagnosticConsideration[];
  clarifying_questions: string[];
};

export type CopilotApiResponse =
  | DraftCopilotApiResponse
  | EditingCopilotApiResponse;

export type CopilotApiError = {
  error: string;
};

export type CopilotGenerateRequest = CopilotFormData & {
  regenerateTarget?: RegenerateTarget;
};

export type CopilotPartialApiResponse = Partial<
  DraftCopilotApiResponse & EditingCopilotApiResponse
>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isICD10Code(value: unknown): value is ICD10Code {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.code === "string" &&
    typeof c.description === "string" &&
    typeof c.rationale === "string"
  );
}

function isICD10CodeArray(value: unknown): value is ICD10Code[] {
  return Array.isArray(value) && value.every(isICD10Code);
}

function isDiagnosticConsideration(
  value: unknown
): value is DiagnosticConsideration {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.diagnosis_to_consider === "string" &&
    isStringArray(c.supported_by) &&
    isStringArray(c.missing_information) &&
    isStringArray(c.rule_out_or_competing_considerations) &&
    isICD10CodeArray(c.icd10_codes)
  );
}

function isDiagnosticConsiderationArray(
  value: unknown
): value is DiagnosticConsideration[] {
  return Array.isArray(value) && value.every(isDiagnosticConsideration);
}

export function isDraftCopilotApiResponse(
  value: unknown
): value is DraftCopilotApiResponse {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.birp_note === "string" &&
    isStringArray(c.interventions) &&
    isStringArray(c.supervision_questions) &&
    isStringArray(c.compliance_flags) &&
    isStringArray(c.next_session_focus) &&
    typeof c.clinical_hypothesis === "string" &&
    isDiagnosticConsiderationArray(c.diagnostic_considerations) &&
    isStringArray(c.clarifying_questions)
  );
}

export function isEditingCopilotApiResponse(
  value: unknown
): value is EditingCopilotApiResponse {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.revised_note === "string" &&
    isStringArray(c.wording_suggestions) &&
    isStringArray(c.rationale_for_edits) &&
    isStringArray(c.supervision_questions) &&
    isStringArray(c.compliance_flags) &&
    isDiagnosticConsiderationArray(c.diagnostic_considerations) &&
    isStringArray(c.clarifying_questions)
  );
}

export function isCopilotApiResponse(
  value: unknown,
  outputMode: OutputMode
): value is CopilotApiResponse {
  return outputMode === "draft"
    ? isDraftCopilotApiResponse(value)
    : isEditingCopilotApiResponse(value);
}

export function isCopilotApiError(value: unknown): value is CopilotApiError {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return typeof c.error === "string";
}

export function isCopilotPartialApiResponse(
  value: unknown
): value is CopilotPartialApiResponse {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;

  return (
    (c.birp_note === undefined || typeof c.birp_note === "string") &&
    (c.interventions === undefined || isStringArray(c.interventions)) &&
    (c.supervision_questions === undefined || isStringArray(c.supervision_questions)) &&
    (c.compliance_flags === undefined || isStringArray(c.compliance_flags)) &&
    (c.next_session_focus === undefined || isStringArray(c.next_session_focus)) &&
    (c.clinical_hypothesis === undefined || typeof c.clinical_hypothesis === "string") &&
    (c.revised_note === undefined || typeof c.revised_note === "string") &&
    (c.wording_suggestions === undefined || isStringArray(c.wording_suggestions)) &&
    (c.rationale_for_edits === undefined || isStringArray(c.rationale_for_edits)) &&
    (c.diagnostic_considerations === undefined || isDiagnosticConsiderationArray(c.diagnostic_considerations)) &&
    (c.clarifying_questions === undefined || isStringArray(c.clarifying_questions))
  );
}
