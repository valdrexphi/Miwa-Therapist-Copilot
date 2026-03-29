"use client";

import {
  CASE_TYPES,
  NOTE_FORMATS,
  ORIENTATIONS,
  OUTPUT_MODES,
  type CopilotFormData,
} from "@/lib/types";

const CHAR_LIMITS = {
  presentingProblem: 2000,
  treatmentGoal: 1000,
  sessionNotes: 4000,
};

type CopilotFormProps = {
  form: CopilotFormData;
  isLoading: boolean;
  onChange: (updated: CopilotFormData) => void;
  onSubmit: () => void;
  onLoadSample: (id: string) => void;
  sampleCases: Array<{ id: string; label: string }>;
};

function CharCounter({ value, limit }: { value: string; limit: number }) {
  const remaining = limit - value.length;
  const isNear = remaining < limit * 0.15;
  const isOver = remaining < 0;
  return (
    <span
      className={`char-counter ${isOver ? "char-counter-over" : isNear ? "char-counter-near" : ""}`}
      aria-live="polite"
    >
      {value.length}/{limit}
    </span>
  );
}

export default function CopilotForm({
  form,
  isLoading,
  onChange,
  onSubmit,
  onLoadSample,
  sampleCases,
}: CopilotFormProps) {
  function set<K extends keyof CopilotFormData>(key: K, value: CopilotFormData[K]) {
    onChange({ ...form, [key]: value });
  }

  const canSubmit =
    !isLoading &&
    form.caseType !== "" &&
    form.orientation !== "" &&
    form.presentingProblem.trim().length > 0 &&
    form.treatmentGoal.trim().length > 0 &&
    form.sessionNotes.trim().length > 0;

  return (
    <div className="form-panel">
      <div className="form-panel-header">
        <h2 className="form-panel-title">Session Context</h2>
        <p className="form-panel-subtitle">
          Enter de-identified information only. Do not include client names, dates of birth, addresses, or any other identifying details.
        </p>
        <div className="phi-warning-inline">
          <span className="phi-warning-icon">⚠</span>
          <span>
            <strong>No PHI.</strong> This tool is for therapist support only. Do not enter client-identifying information. Output is not legal or medical advice.
          </span>
        </div>
      </div>

      <div className="form-body">
        {/* Row 1: Case type + Output mode */}
        <div className="form-row-2col">
          <div className="field-group">
            <label className="field-label" htmlFor="caseType">Case Type</label>
            <select
              id="caseType"
              className="field-select"
              value={form.caseType}
              onChange={(e) => set("caseType", e.target.value as CopilotFormData["caseType"])}
            >
              <option value="">Select…</option>
              {CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="outputMode">Output Mode</label>
            <select
              id="outputMode"
              className="field-select"
              value={form.outputMode}
              onChange={(e) => set("outputMode", e.target.value as CopilotFormData["outputMode"])}
            >
              {OUTPUT_MODES.map((m) => (
                <option key={m} value={m}>
                  {m === "draft" ? "Draft Mode" : "Editing Mode"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Note format + Orientation */}
        <div className="form-row-2col">
          <div className="field-group">
            <label className="field-label" htmlFor="noteFormat">Note Format</label>
            <select
              id="noteFormat"
              className="field-select"
              value={form.noteFormat}
              onChange={(e) => set("noteFormat", e.target.value as CopilotFormData["noteFormat"])}
            >
              {NOTE_FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="orientation">Therapeutic Orientation</label>
            <select
              id="orientation"
              className="field-select"
              value={form.orientation}
              onChange={(e) => set("orientation", e.target.value as CopilotFormData["orientation"])}
            >
              <option value="">Select…</option>
              {ORIENTATIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Presenting problem */}
        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label" htmlFor="presentingProblem">Presenting Problem</label>
            <CharCounter value={form.presentingProblem} limit={CHAR_LIMITS.presentingProblem} />
          </div>
          <textarea
            id="presentingProblem"
            className="field-textarea field-textarea-sm"
            placeholder="Brief description of the presenting concern (de-identified)…"
            value={form.presentingProblem}
            maxLength={CHAR_LIMITS.presentingProblem}
            onChange={(e) => set("presentingProblem", e.target.value)}
            rows={3}
          />
        </div>

        {/* Treatment goal */}
        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label" htmlFor="treatmentGoal">Treatment Goal</label>
            <CharCounter value={form.treatmentGoal} limit={CHAR_LIMITS.treatmentGoal} />
          </div>
          <textarea
            id="treatmentGoal"
            className="field-textarea field-textarea-sm"
            placeholder="Primary treatment goal for this case…"
            value={form.treatmentGoal}
            maxLength={CHAR_LIMITS.treatmentGoal}
            onChange={(e) => set("treatmentGoal", e.target.value)}
            rows={2}
          />
        </div>

        {/* Session notes */}
        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label" htmlFor="sessionNotes">Session Notes</label>
            <CharCounter value={form.sessionNotes} limit={CHAR_LIMITS.sessionNotes} />
          </div>
          <textarea
            id="sessionNotes"
            className="field-textarea field-textarea-lg"
            placeholder={"Bullet notes from the session (de-identified):\n- Client reported…\n- Therapist explored…\n- Session focused on…"}
            value={form.sessionNotes}
            maxLength={CHAR_LIMITS.sessionNotes}
            onChange={(e) => set("sessionNotes", e.target.value)}
            rows={8}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            className="button button-primary"
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Generating…
              </>
            ) : (
              "Generate Draft"
            )}
          </button>

          {sampleCases.length > 0 && (
            <div className="sample-row">
              <span className="sample-label">Load sample:</span>
              {sampleCases.map((s) => (
                <button
                  key={s.id}
                  className="sample-button"
                  onClick={() => onLoadSample(s.id)}
                  disabled={isLoading}
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
