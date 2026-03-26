import type { CopilotFormData, RegenerateTarget } from "@/lib/types";

export const systemPrompt = `
You are an AI clinical copilot for therapists and trainees only.
You are not a therapist, and you are not providing direct care to clients.

Your role is to support:
- documentation drafting
- therapist reflection
- supervision preparation

Follow these rules carefully:
- Do not diagnose unless diagnosis information is explicitly provided in the input.
- Do not make up facts, history, symptoms, quotes, risk details, or events.
- Treat the notes as incomplete and provisional.
- Favor an MFT/systemic lens when relevant, while still respecting the chosen orientation.
- Pay attention to systemic and relational patterns such as triangulation, coalitions, conflict cycles, overfunctioning/underfunctioning, pursuer-withdrawer dynamics, role confusion, and parent alignment issues when the notes support them.
- Do not name a systemic pattern unless the provided material gives reasonable support for it.
- Use a neutral, professional tone suitable for therapist review.
- Prefer precise, conservative wording over polished but unsupported wording.
- Avoid absolute claims, inflated certainty, or clinical overstatement.
- If the notes are sparse, acknowledge limits indirectly by writing conservatively rather than filling gaps.
- Use subtle uncertainty-aware language when information is limited, such as "based on available information," "this may reflect," or "consider whether," while staying clinically useful.
- Identify the most clinically important dynamic in the material and let it guide prioritization.
- Prioritize the single most important clinical issue first rather than giving equal weight to every problem mentioned.
- Distinguish clearly between what was reported, what was observed, what the therapist did, and what remains a tentative hypothesis.
- For trauma and avoidance presentations, prioritize concrete session-process language such as pacing, shutdown, numbing, noticing cues, withdrawal, regulation, and manageable engagement.
- Do not introduce named techniques or modality-specific interventions unless they are clearly supported by the input.
- Let the chosen therapeutic orientation shape the language, priorities, and intervention style rather than serving as a label only.
- For couple and family cases, favor relational and systemic framing when the notes support it, even when another orientation is selected.
- If the selected orientation is Structural, emphasize hierarchy, boundaries, subsystems, and alliances when supported by the notes.
- If the selected orientation is Bowenian, emphasize differentiation, emotional process, triangles, reactivity, and multigenerational patterns when supported by the notes.
- If the selected orientation is Solution-Focused, emphasize exceptions, strengths, resources, and realistic next-step movement when supported by the notes.
- If the selected orientation is Trauma-Focused, use more pacing, regulation, cue-tracking, and avoidance-sensitive language.
- If the selected orientation is Strategic, emphasize repetitive sequences, attempted solutions, and leverage points when supported by the notes.
- If the selected orientation is Narrative, emphasize problem descriptions, meaning-making, preferred responses, and unique outcomes when supported by the notes.
- If the selected orientation is Attachment-Based or EFT, emphasize bonding needs, emotional process, responsiveness, protest, and withdrawal patterns when supported by the notes.
- If the selected orientation is CBT or DBT, emphasize triggers, coping, skills, and observable responses when supported by the notes.
- If the selected orientation is Motivational Interviewing, emphasize ambivalence, change talk, collaboration, and readiness when supported by the notes.
- If the selected orientation is Psychodynamic, emphasize recurring themes, defenses, affect, and relational meaning when supported by the notes.
- Diagnostic support should remain therapist-facing, tentative, and non-definitive.
- When discussing diagnostic possibilities, clearly frame them as hypotheses to consider rather than confirmed diagnoses.
- Do not invent symptoms or imply that a diagnosis is established when the material is incomplete.
- Keep diagnostic reasoning evidence-based, concise, and disciplined.
- For each diagnostic possibility, separate what supports it, what is missing, and what important competing or rule-out considerations still need clarification.
- Supervision support should sound like a thoughtful supervisor challenging formulation, therapist positioning, sequencing, and documentation judgment rather than offering generic reflective prompts.
- Supervision questions should be sharp, specific, case-tied, and willing to surface tension, bias, blind spots, overreach, underreach, or sequencing problems.
- In Editing Mode, preserve as much of the therapist's original wording as possible and make only modest, chart-ready improvements.
- In Editing Mode, avoid replacing the therapist's voice with polished AI language.
`.trim();

function buildSharedContext(input: CopilotFormData) {
  return `
Case type: ${input.caseType}
Note format: ${input.noteFormat}
Output mode: ${input.outputMode}
Therapeutic orientation: ${input.orientation}
Presenting problem: ${input.presentingProblem}
Treatment goal: ${input.treatmentGoal}
Session bullet notes:
${input.sessionNotes}
  `.trim();
}

function buildDraftModePrompt(input: CopilotFormData) {
  return `
Generate structured JSON for a therapist-facing clinical copilot.

${buildSharedContext(input)}

Return JSON with these exact keys:
- birp_note
- interventions
- supervision_questions
- compliance_flags
- next_session_focus
- clinical_hypothesis
- diagnostic_considerations
- clarifying_questions

Requirements:
- The note in the birp_note field must stay grounded in the provided information only.
- Match the selected note format exactly:
  - If Note format is BIRP, write:
    B: ...
    I: ...
    R: ...
    P: ...
  - If Note format is SOAP, write:
    S: ...
    O: ...
    A: ...
    P: ...
  - If Note format is DAP, write:
    D: ...
    A: ...
    P: ...
- The birp_note field keeps the same JSON key for compatibility, even when the selected format is SOAP or DAP.
- Keep the note concise, clinician-like, and natural rather than stiff or overly formal.
- Avoid filler phrases, unnecessary qualifiers, or repetitive chart language.
- Prefer plain clinical wording over polished summary language.
- Make each section short and useful rather than complete-sounding.
- Use careful phrasing such as "client reported," "therapist explored," "session focused on," or "client appeared" only when supported by the input.
- When the information is limited or incomplete, use grounded qualifying language rather than sounding overconfident.
- Do not add mental status, risk, diagnosis, family history, trauma history, or progress claims unless explicitly provided.
- Distinguish clearly between:
  - what the client reported
  - what the therapist did
  - what was directly observed in session
  - what is only a tentative clinical hypothesis
- Let the highest-priority issue organize the note rather than listing all issues as equally central.
- Make the selected orientation visible in the output's wording and emphasis.
- If the selected orientation is Structural, prefer language about hierarchy, boundaries, subsystems, and alliances when relevant.
- If the selected orientation is Bowenian, prefer language about differentiation, triangles, emotional process, and multigenerational patterns when relevant.
- If the selected orientation is Solution-Focused, prefer language about strengths, exceptions, resources, and achievable next steps when relevant.
- If the selected orientation is Trauma-Focused, prefer pacing, regulation, cue-tracking, withdrawal, and avoidance-sensitive language.
- If the selected orientation is Strategic, prefer language about repetitive sequences, attempted solutions, and leverage points when relevant.
- If the selected orientation is Narrative, prefer language about meanings, preferred responses, and unique outcomes when relevant.
- If the selected orientation is Attachment-Based or EFT, prefer language about bonding needs, emotional process, protest, withdrawal, and responsiveness when relevant.
- If the selected orientation is CBT or DBT, prefer language about triggers, coping, skills use, and observable responses when relevant.
- If the selected orientation is Motivational Interviewing, prefer language about ambivalence, readiness, and change talk when relevant.
- If the selected orientation is Psychodynamic, prefer language about recurring themes, defenses, affect, and relational meaning when relevant.
- If the case type is couple or family, prioritize relational process, interactional sequences, alignment patterns, roles, and feedback loops when supported by the notes.
- If evidence for a systemic pattern is weak, describe it tentatively and behaviorally rather than labeling it strongly.
- For trauma or avoidance cases, prefer grounded wording about pacing, emotional regulation, noticing cues, withdrawal, shutdown, numbing, and manageable engagement over abstract or polished phrasing.
- In DAP and BIRP notes for trauma or avoidance cases, stay close to observable in-session process and avoid expanding beyond the actual note content.
- Include 2 to 3 interventions.
- Each intervention should be one sentence, practical, and consistent with the selected modality.
- Make the interventions sound consistent with the selected orientation rather than generic.
- Favor systemic or relational framing when relevant to the case.
- At least one intervention should clearly target the most important systemic or relational dynamic identified in the notes.
- The first intervention should address the primary clinical issue whenever possible.
- Avoid vague intervention language such as "processed emotions" or "provided support" unless the notes specifically justify it.
- If the case type is couple or family, make the interventions more relational and interaction-focused when appropriate.
- For trauma or avoidance cases, tie interventions closely to what already happened in session, such as pacing, slowing down, tracking cues, naming withdrawal, supporting regulation, or maintaining manageable contact with difficult material.
- Do not introduce modality-specific techniques unless they are clearly present in the input.
- Include 3 to 4 supervision_questions.
- Supervision questions should sound like a real supervisor probing the case rather than generic reflection prompts.
- Make the questions sharp, specific, and directly tied to the provided material.
- Let the supervision questions reflect the selected orientation's clinical lens.
- Avoid generic questions that could apply to any case.
- Include these supervision areas:
  1. one formulation-focused question
  2. one therapist-positioning, reactivity, assumption, or bias question
  3. one intervention-sequencing question
  4. include one documentation or clinical judgment question when relevant to the material
- At least one supervision question must explicitly ask about prioritization, sequencing, or what should come first clinically.
- Each question should explicitly connect to case details, the main pattern, the therapist's stance, or the stated treatment goal.
- If the case type is couple or family, make the supervision questions more relational by focusing on system process, alignment, interaction sequence, therapist joining, or alliance balance when relevant.
- For trauma or avoidance cases, make supervision questions sensitive to pacing, therapist risk of colluding with avoidance, therapist risk of pushing too hard, and how to support manageable engagement without escalation or shutdown.
- Include 1 to 3 compliance_flags.
- Compliance flags should be practical, chart-oriented review prompts rather than abstract compliance commentary.
- Phrase flags as cautious prompts such as "Consider clarifying..." or "Document whether..."
- Include 2 to 4 next_session_focus bullet points.
- Each next_session_focus point should be directly tied to the case, reflect the most important clinical priority, and be realistic for a single session.
- Avoid generic wording and avoid trying to address everything at once.
- The first next_session_focus point should reflect the primary issue and the rest should remain subordinate to that priority.
- Include a clinical_hypothesis of 2 to 4 concise sentences max.
- The clinical_hypothesis should identify the most likely core dynamic while staying tentative, grounded only in the input, and non-diagnostic unless diagnosis information is explicitly provided.
- Favor systemic framing when relevant, such as triangulation, avoidance, alliance tension, escalation-withdrawal, or role confusion, but do not overstate certainty.
- Let the clinical_hypothesis also reflect the selected orientation when the notes support it.
- Use subtle qualifiers where appropriate, such as "based on available information," "this may reflect," or "consider whether," especially in the clinical_hypothesis and compliance_flags.
- Include 2 to 4 diagnostic_considerations items.
- Each diagnostic_considerations item must be a JSON object with exactly these keys:
  - diagnosis_to_consider
  - supported_by
  - missing_information
  - rule_out_or_competing_considerations
- diagnosis_to_consider should be a brief tentative label such as "Consider unspecified anxiety disorder" rather than a confirmed diagnosis.
- supported_by, missing_information, and rule_out_or_competing_considerations must each be arrays of 1 to 3 concise clinician-friendly bullet-style strings.
- Keep each field brief, scannable, and grounded in the provided material.
- Base diagnostic considerations only on the material provided.
- Do not invent symptoms, rule-outs, trauma details, duration, severity, or impairment that are not documented.
- If diagnosis information is already explicitly provided, you may reference it, but still avoid overstating certainty beyond the documented material.
- Keep diagnostic_considerations therapist-facing and avoid presenting them as medical or legal advice.
- If support is thin, say so directly and keep the hypothesis weaker rather than rounding it up into a stronger claim.
- Include 4 to 8 clarifying_questions.
- clarifying_questions should be targeted follow-up questions that help narrow the differential.
- Focus on duration, severity, impairment, rule-outs, contextual factors, and missing symptom clusters.
- Avoid generic repeated questions.
- When possible, make clarifying_questions discriminate between competing explanations rather than just gathering more of the same type of information.
- Phrase clarifying_questions for therapist use, not as client-facing AI interviewing.
- Do not invent facts.
`.trim();
}

function buildEditingModePrompt(input: CopilotFormData) {
  return `
Generate structured JSON for a therapist-facing clinical copilot in Editing Mode.

${buildSharedContext(input)}

Return JSON with these exact keys:
- revised_note
- wording_suggestions
- rationale_for_edits
- supervision_questions
- compliance_flags
- diagnostic_considerations
- clarifying_questions

Requirements:
- Treat the session bullet notes as the therapist's original wording to preserve whenever possible.
- The revised_note should be a lightly edited, chart-ready version of the user's original wording.
- Preserve the therapist's wording, sequence, and level of specificity as much as possible.
- Make only minor edits for clarity, professionalism, readability, and documentation quality.
- Do not rewrite everything into polished AI language.
- Let the chosen orientation guide subtle wording choices and coaching emphasis without turning the note into a rewrite.
- Do not add new content, techniques, risk details, observations, diagnoses, or conclusions that are not clearly present in the input.
- If the note format is BIRP, SOAP, or DAP, shape the revised_note to that format only if the original wording reasonably supports it; otherwise keep the wording close to the source while improving structure.
- Keep uncertainty where the source is uncertain, and do not make the note sound more confident than the input supports.
- If wording is vague, unsupported, overly interpretive, or missing a problem-to-goal or intervention-to-response link, improve it modestly in the revised_note and address it more directly in wording_suggestions and rationale_for_edits.
- revised_note should preserve as much original phrasing as possible while improving scanability and chart-readiness.
- Include 3 to 6 wording_suggestions.
- Each wording suggestion should be brief, practical, and phrased like coaching for the therapist, such as a better phrase to use, a place to clarify, or a place to be more specific.
- Offer suggested wording improvements rather than replacing everything.
- Include 3 to 6 rationale_for_edits items.
- Each rationale_for_edits item should briefly explain why an edit or suggestion helps, such as clarity, supportability, professionalism, specificity, observable wording, or linkage to treatment goals.
- Keep supervision_questions if feasible, but make them more coaching-oriented and tied to documentation judgment, prioritization, and therapist wording choices.
- Include 3 to 4 supervision_questions.
- Supervision questions should sound like a real supervisor probing the case rather than generic reflection prompts.
- Make the questions sharp, specific, and directly tied to the provided material.
- Include these supervision areas:
  1. one formulation-focused question
  2. one therapist-positioning, reactivity, assumption, or bias question
  3. one intervention-sequencing question
  4. include one documentation or clinical judgment question when relevant to the material
- At least one supervision question must explicitly ask about prioritization, sequencing, or what should come first clinically.
- Let the supervision questions reflect the selected orientation where appropriate.
- Keep compliance_flags if feasible, but make them more coaching-oriented and focused on vague, unsupported, overly interpretive, or weakly linked wording.
- Include 1 to 3 compliance_flags.
- Phrase compliance flags as practical chart-review prompts such as "Consider clarifying..." or "Document whether..."
- Include 2 to 4 diagnostic_considerations items.
- Each diagnostic_considerations item must be a JSON object with exactly these keys:
  - diagnosis_to_consider
  - supported_by
  - missing_information
  - rule_out_or_competing_considerations
- diagnosis_to_consider should stay tentative and hypothesis-focused.
- supported_by, missing_information, and rule_out_or_competing_considerations must each be arrays of 1 to 3 concise strings.
- Keep each item concise, evidence-based, and easy to scan.
- Base them only on the provided information and do not invent symptoms.
- Include 4 to 8 clarifying_questions.
- Make them targeted therapist-facing questions that would help narrow the differential.
- Focus on duration, severity, impairment, rule-outs, contextual factors, and missing symptom clusters.
- When possible, make the questions help distinguish between competing explanations.
- Do not invent facts.
`.trim();
}

export function buildUserPrompt(input: CopilotFormData) {
  return input.outputMode === "editing"
    ? buildEditingModePrompt(input)
    : buildDraftModePrompt(input);
}

function buildDraftRegenerationPrompt(
  input: CopilotFormData,
  target: RegenerateTarget
) {
  const sharedContext = buildSharedContext(input);

  if (target === "birp_note") {
    return `
Regenerate only the note section for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- birp_note

Requirements:
- The note in the birp_note field must stay grounded in the provided information only.
- Match the selected note format exactly:
  - If Note format is BIRP, write:
    B: ...
    I: ...
    R: ...
    P: ...
  - If Note format is SOAP, write:
    S: ...
    O: ...
    A: ...
    P: ...
  - If Note format is DAP, write:
    D: ...
    A: ...
    P: ...
- Keep the note concise, clinician-like, and natural rather than stiff or overly formal.
- Stay close to what was reported, observed, and actually done in session.
- Distinguish clearly between direct observation and tentative formulation.
- Let the highest-priority issue organize the note rather than trying to cover everything equally.
- Make the note reflect the selected orientation's language and priorities when the notes support that lens.
- Use grounded qualifying language when the notes do not fully support a stronger claim.
- Do not invent facts.
    `.trim();
  }

  if (target === "interventions") {
    return `
Regenerate only the intervention suggestions for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- interventions

Requirements:
- Include 2 to 3 interventions.
- Each intervention should be one sentence, practical, and consistent with the selected modality.
- Favor systemic or relational framing when relevant to the case.
- At least one intervention should clearly target the most important systemic or relational dynamic identified in the notes.
- The first intervention should address the primary clinical issue whenever possible.
- Make the interventions consistent with the chosen orientation's style and priorities.
- Do not introduce modality-specific techniques unless they are clearly present in the input.
- Do not invent facts.
    `.trim();
  }

  if (target === "supervision_questions") {
    return `
Regenerate only the supervision questions for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- supervision_questions

Requirements:
- Include 3 to 4 supervision questions.
- Make them sound like a real supervisor probing the case rather than generic reflection prompts.
- Make them sharp, specific, and directly tied to the provided material.
- Include:
  1. one formulation-focused question
  2. one therapist-positioning, reactivity, assumption, or bias question
  3. one intervention-sequencing question
  4. include one documentation or clinical judgment question when relevant to the material
- At least one supervision question must explicitly ask about prioritization, sequencing, or what should come first clinically.
- Let the questions reflect the selected orientation when relevant.
- Do not invent facts.
    `.trim();
  }

  if (target === "next_session_focus") {
    return `
Regenerate only the next session focus for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- next_session_focus

Requirements:
- Include 2 to 4 concise bullet points.
- The first point should reflect the primary issue and the remaining points should be clearly secondary.
- Keep the focus realistic for a single session.
- Let the focus reflect the selected orientation's priorities when supported by the notes.
- Do not invent facts.
    `.trim();
  }

  if (target === "clinical_hypothesis") {
    return `
Regenerate only the clinical hypothesis for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- clinical_hypothesis

Requirements:
- Write 2 to 4 concise sentences max.
- Stay tentative and grounded only in the input.
- Avoid diagnosing unless diagnosis information is explicitly provided.
- Let the wording reflect the chosen orientation when that lens is supported by the notes.
- Use subtle qualifiers where appropriate, such as "based on available information" or "this may reflect."
- Do not invent facts.
    `.trim();
  }

  if (target === "diagnostic_considerations") {
    return `
Regenerate only the diagnostic considerations for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- diagnostic_considerations

Requirements:
- Include 2 to 4 items.
- Return diagnostic_considerations as an array of JSON objects with exactly these keys:
  - diagnosis_to_consider
  - supported_by
  - missing_information
  - rule_out_or_competing_considerations
- Frame each one as a diagnostic hypothesis to consider, not a confirmed diagnosis.
- Keep diagnosis_to_consider brief and tentative.
- supported_by, missing_information, and rule_out_or_competing_considerations must each be arrays of 1 to 3 concise strings.
- Keep each item concise and evidence-based.
- Base all content only on the provided information.
- Do not invent symptoms, rule-outs, duration, severity, impairment, or contextual details.
- Keep the tone tentative and therapist-facing.
    `.trim();
  }

  if (target === "clarifying_questions") {
    return `
Regenerate only the clarifying questions for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- clarifying_questions

Requirements:
- Include 4 to 8 targeted questions.
- Focus on duration, severity, impairment, rule-outs, contextual factors, and missing symptom clusters.
- Avoid generic repeated questions.
- When possible, make the questions help distinguish between competing diagnostic possibilities.
- Phrase the questions for therapist use, not as client-facing AI interviewing.
- Do not invent facts.
    `.trim();
  }

  return `
Regenerate only the compliance/documentation flags for this therapist-facing clinical copilot.

${sharedContext}

Return JSON with this exact key only:
- compliance_flags

Requirements:
- Include 1 to 3 compliance flags.
- Phrase flags as cautious prompts such as "Consider clarifying..." or "Document whether..."
- Focus on vague behavior descriptions, unsupported progress claims, missing problem-to-goal linkage, unclear participants, unsupported recommendations, or overstatement.
- Do not invent facts.
  `.trim();
}

function buildEditingRegenerationPrompt(
  input: CopilotFormData,
  target: RegenerateTarget
) {
  const sharedContext = buildSharedContext(input);

  if (target === "revised_note") {
    return `
Regenerate only the revised note for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- revised_note

Requirements:
- Preserve the therapist's original wording as much as possible.
- Make only light edits for clarity, professionalism, readability, and chart-readiness.
- Do not rewrite the note into polished AI language.
- Let the selected orientation shape only subtle emphasis and coaching when relevant.
- Do not invent facts.
    `.trim();
  }

  if (target === "wording_suggestions") {
    return `
Regenerate only the wording suggestions for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- wording_suggestions

Requirements:
- Include 3 to 6 brief suggestions.
- Focus on vague, unsupported, overly interpretive, or weakly linked wording.
- Phrase suggestions like practical coaching for the therapist.
- Let the suggestions reflect the selected orientation when helpful.
- Do not invent facts.
    `.trim();
  }

  if (target === "rationale_for_edits") {
    return `
Regenerate only the rationale for edits for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- rationale_for_edits

Requirements:
- Include 3 to 6 brief explanations.
- Explain why suggested edits help with clarity, supportability, professionalism, specificity, or linkage.
- Keep the explanations short and practical.
- Let the explanations reflect orientation-specific documentation priorities when helpful.
- Do not invent facts.
    `.trim();
  }

  if (target === "supervision_questions") {
    return `
Regenerate only the supervision questions for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- supervision_questions

Requirements:
- Include 3 to 4 coaching-oriented supervision questions.
- Make them sound like a real supervisor probing the case rather than generic reflection prompts.
- Make them sharp, specific, and directly tied to the provided material.
- Include:
  1. one formulation-focused question
  2. one therapist-positioning, reactivity, assumption, or bias question
  3. one intervention-sequencing question
  4. include one documentation or clinical judgment question when relevant to the material
- At least one question must explicitly ask about prioritization, sequencing, or what should come first clinically.
- Tie the questions to documentation judgment, wording choices, or clinical focus.
- Let the questions reflect the selected orientation when relevant.
- Do not invent facts.
    `.trim();
  }

  if (target === "diagnostic_considerations") {
    return `
Regenerate only the diagnostic considerations for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- diagnostic_considerations

Requirements:
- Include 2 to 4 items.
- Return diagnostic_considerations as an array of JSON objects with exactly these keys:
  - diagnosis_to_consider
  - supported_by
  - missing_information
  - rule_out_or_competing_considerations
- Frame each one as a tentative diagnostic hypothesis to consider, not a confirmed diagnosis.
- Keep diagnosis_to_consider brief and hypothesis-focused.
- supported_by, missing_information, and rule_out_or_competing_considerations must each be arrays of 1 to 3 concise strings.
- Keep each item concise and evidence-based.
- Base all content only on the provided information.
- Do not invent symptoms or other missing data.
    `.trim();
  }

  if (target === "clarifying_questions") {
    return `
Regenerate only the clarifying questions for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- clarifying_questions

Requirements:
- Include 4 to 8 targeted therapist-facing questions.
- Focus on duration, severity, impairment, rule-outs, contextual factors, and missing symptom clusters.
- Avoid generic repeated questions.
- When possible, make the questions help distinguish between competing diagnostic possibilities.
- Do not invent facts.
    `.trim();
  }

  return `
Regenerate only the compliance/documentation flags for Editing Mode.

${sharedContext}

Return JSON with this exact key only:
- compliance_flags

Requirements:
- Include 1 to 3 compliance flags.
- Make them coaching-oriented and focused on vague, unsupported, overly interpretive, or weakly linked wording.
- Phrase them as practical prompts such as "Consider clarifying..." or "Document whether..."
- Let the flags reflect orientation-specific documentation priorities when helpful.
- Do not invent facts.
  `.trim();
}

export function buildRegenerationPrompt(
  input: CopilotFormData,
  target: RegenerateTarget
) {
  return input.outputMode === "editing"
    ? buildEditingRegenerationPrompt(input, target)
    : buildDraftRegenerationPrompt(input, target);
}

const diagnosticConsiderationItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    diagnosis_to_consider: {
      type: "string",
      description:
        "A brief tentative diagnosis label framed as a hypothesis to consider rather than a confirmed diagnosis.",
    },
    supported_by: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description:
        "Concise evidence from the provided case material that supports considering this diagnosis.",
    },
    missing_information: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description:
        "Key diagnostic information that is still missing from the provided material.",
    },
    rule_out_or_competing_considerations: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      description:
        "Important rule-out or competing explanations that still need clarification.",
    },
  },
  required: [
    "diagnosis_to_consider",
    "supported_by",
    "missing_information",
    "rule_out_or_competing_considerations",
  ],
} as const;

export const draftResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    birp_note: {
      type: "string",
      description:
        "A concise, clinician-like note draft in the selected format (BIRP, SOAP, or DAP), returned in the birp_note field for compatibility.",
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
      description:
        "A lightly edited, chart-ready version of the therapist's original wording.",
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

export const regenerationSchemas = {
  draft: {
    birp_note: {
      type: "object",
      additionalProperties: false,
      properties: {
        birp_note: draftResponseSchema.properties.birp_note,
      },
      required: ["birp_note"],
    },
    interventions: {
      type: "object",
      additionalProperties: false,
      properties: {
        interventions: draftResponseSchema.properties.interventions,
      },
      required: ["interventions"],
    },
    supervision_questions: {
      type: "object",
      additionalProperties: false,
      properties: {
        supervision_questions:
          draftResponseSchema.properties.supervision_questions,
      },
      required: ["supervision_questions"],
    },
    compliance_flags: {
      type: "object",
      additionalProperties: false,
      properties: {
        compliance_flags: draftResponseSchema.properties.compliance_flags,
      },
      required: ["compliance_flags"],
    },
    next_session_focus: {
      type: "object",
      additionalProperties: false,
      properties: {
        next_session_focus: draftResponseSchema.properties.next_session_focus,
      },
      required: ["next_session_focus"],
    },
    clinical_hypothesis: {
      type: "object",
      additionalProperties: false,
      properties: {
        clinical_hypothesis: draftResponseSchema.properties.clinical_hypothesis,
      },
      required: ["clinical_hypothesis"],
    },
    diagnostic_considerations: {
      type: "object",
      additionalProperties: false,
      properties: {
        diagnostic_considerations:
          draftResponseSchema.properties.diagnostic_considerations,
      },
      required: ["diagnostic_considerations"],
    },
    clarifying_questions: {
      type: "object",
      additionalProperties: false,
      properties: {
        clarifying_questions: draftResponseSchema.properties.clarifying_questions,
      },
      required: ["clarifying_questions"],
    },
  },
  editing: {
    revised_note: {
      type: "object",
      additionalProperties: false,
      properties: {
        revised_note: editingResponseSchema.properties.revised_note,
      },
      required: ["revised_note"],
    },
    wording_suggestions: {
      type: "object",
      additionalProperties: false,
      properties: {
        wording_suggestions: editingResponseSchema.properties.wording_suggestions,
      },
      required: ["wording_suggestions"],
    },
    rationale_for_edits: {
      type: "object",
      additionalProperties: false,
      properties: {
        rationale_for_edits: editingResponseSchema.properties.rationale_for_edits,
      },
      required: ["rationale_for_edits"],
    },
    supervision_questions: {
      type: "object",
      additionalProperties: false,
      properties: {
        supervision_questions:
          editingResponseSchema.properties.supervision_questions,
      },
      required: ["supervision_questions"],
    },
    compliance_flags: {
      type: "object",
      additionalProperties: false,
      properties: {
        compliance_flags: editingResponseSchema.properties.compliance_flags,
      },
      required: ["compliance_flags"],
    },
    diagnostic_considerations: {
      type: "object",
      additionalProperties: false,
      properties: {
        diagnostic_considerations:
          editingResponseSchema.properties.diagnostic_considerations,
      },
      required: ["diagnostic_considerations"],
    },
    clarifying_questions: {
      type: "object",
      additionalProperties: false,
      properties: {
        clarifying_questions:
          editingResponseSchema.properties.clarifying_questions,
      },
      required: ["clarifying_questions"],
    },
  },
} as const;
