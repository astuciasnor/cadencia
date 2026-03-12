import type { ExecutionEntry } from "./types";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeActions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeText(entry))
    .filter((entry, index, array) => entry.length > 0 && array.indexOf(entry) === index);
}

export function createDefaultExecutionEntry(): ExecutionEntry {
  return {
    mode: "solo",
    materials: "",
    actions: [],
    contacts: "",
    phones: "",
    notes: "",
    instructions: "",
    updatedAt: null
  };
}

export function sanitizeExecutionEntry(value: Partial<ExecutionEntry> | null | undefined): ExecutionEntry {
  if (!value) {
    return createDefaultExecutionEntry();
  }

  return {
    mode: value.mode === "meeting" ? "meeting" : "solo",
    materials: normalizeText(value.materials),
    actions: normalizeActions(value.actions),
    contacts: normalizeText(value.contacts),
    phones: normalizeText(value.phones),
    notes: normalizeText(value.notes),
    instructions: normalizeText(value.instructions),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null
  };
}

export function sanitizeExecutionRecord(
  value: Record<string, Partial<ExecutionEntry>> | null | undefined
): Record<string, ExecutionEntry> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, entry]) => [key, sanitizeExecutionEntry(entry)])
  );
}
