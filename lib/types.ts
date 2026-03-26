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

export type DiagnosticConsideration = {
  diagnosis_to_consider: string;
  supported_by: string[];
  missing_information: string[];
  rule_out_or_competing_considerations: string[];
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

function isDiagnosticConsideration(
  value: unknown
): value is DiagnosticConsideration {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.diagnosis_to_consider === "string" &&
    isStringArray(candidate.supported_by) &&
    isStringArray(candidate.missing_information) &&
    isStringArray(candidate.rule_out_or_competing_considerations)
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
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.birp_note === "string" &&
    isStringArray(candidate.interventions) &&
    isStringArray(candidate.supervision_questions) &&
    isStringArray(candidate.compliance_flags) &&
    isStringArray(candidate.next_session_focus) &&
    typeof candidate.clinical_hypothesis === "string" &&
    isDiagnosticConsiderationArray(candidate.diagnostic_considerations) &&
    isStringArray(candidate.clarifying_questions)
  );
}

export function isEditingCopilotApiResponse(
  value: unknown
): value is EditingCopilotApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.revised_note === "string" &&
    isStringArray(candidate.wording_suggestions) &&
    isStringArray(candidate.rationale_for_edits) &&
    isStringArray(candidate.supervision_questions) &&
    isStringArray(candidate.compliance_flags) &&
    isDiagnosticConsiderationArray(candidate.diagnostic_considerations) &&
    isStringArray(candidate.clarifying_questions)
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
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.error === "string";
}

export function isCopilotPartialApiResponse(
  value: unknown
): value is CopilotPartialApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  const birpNoteValid =
    candidate.birp_note === undefined || typeof candidate.birp_note === "string";
  const interventionsValid =
    candidate.interventions === undefined || isStringArray(candidate.interventions);
  const supervisionQuestionsValid =
    candidate.supervision_questions === undefined ||
    isStringArray(candidate.supervision_questions);
  const complianceFlagsValid =
    candidate.compliance_flags === undefined ||
    isStringArray(candidate.compliance_flags);
  const nextSessionFocusValid =
    candidate.next_session_focus === undefined ||
    isStringArray(candidate.next_session_focus);
  const clinicalHypothesisValid =
    candidate.clinical_hypothesis === undefined ||
    typeof candidate.clinical_hypothesis === "string";
  const revisedNoteValid =
    candidate.revised_note === undefined ||
    typeof candidate.revised_note === "string";
  const wordingSuggestionsValid =
    candidate.wording_suggestions === undefined ||
    isStringArray(candidate.wording_suggestions);
  const rationaleForEditsValid =
    candidate.rationale_for_edits === undefined ||
    isStringArray(candidate.rationale_for_edits);
  const diagnosticConsiderationsValid =
    candidate.diagnostic_considerations === undefined ||
    isDiagnosticConsiderationArray(candidate.diagnostic_considerations);
  const clarifyingQuestionsValid =
    candidate.clarifying_questions === undefined ||
    isStringArray(candidate.clarifying_questions);

  return (
    birpNoteValid &&
    interventionsValid &&
    supervisionQuestionsValid &&
    complianceFlagsValid &&
    nextSessionFocusValid &&
    clinicalHypothesisValid &&
    revisedNoteValid &&
    wordingSuggestionsValid &&
    rationaleForEditsValid &&
    diagnosticConsiderationsValid &&
    clarifyingQuestionsValid
  );
}
