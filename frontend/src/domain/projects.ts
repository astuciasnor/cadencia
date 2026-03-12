import { DEFAULT_PROJECT_COLOR, PROVISIONAL_PROJECT_ID, PROVISIONAL_PROJECT_TITLE } from "./constants";
import type { Project } from "./types";

function normalizeTimestamp(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export function createProject(title: string, color = DEFAULT_PROJECT_COLOR): Project {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: normalizeProjectTitle(title) || "Projeto sem nome",
    color: normalizeProjectColor(color),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createProvisionalProject(): Project {
  const timestamp = new Date().toISOString();
  return {
    id: PROVISIONAL_PROJECT_ID,
    title: PROVISIONAL_PROJECT_TITLE,
    color: "#7C91BA",
    createdAt: timestamp,
    updatedAt: timestamp,
    isProvisional: true
  };
}

export function normalizeProjectTitle(value: string) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProjectColor(value: string) {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : DEFAULT_PROJECT_COLOR;
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : DEFAULT_PROJECT_COLOR;
}

export function ensureProvisionalProject(projects: Project[]) {
  const existing = projects.find((project) => project.id === PROVISIONAL_PROJECT_ID);
  if (existing) {
    return projects;
  }

  return [createProvisionalProject(), ...projects];
}

export function hydrateProjects(value: Partial<Project>[] | null | undefined): Project[] {
  if (!Array.isArray(value)) {
    return ensureProvisionalProject([]);
  }

  const projects = value.map((project) => {
    const timestamp = new Date().toISOString();
    return {
      id: typeof project.id === "string" && project.id.trim().length > 0 ? project.id : crypto.randomUUID(),
      title: normalizeProjectTitle(project.title ?? "") || "Projeto sem nome",
      color: normalizeProjectColor(project.color ?? DEFAULT_PROJECT_COLOR),
      createdAt: normalizeTimestamp(project.createdAt, timestamp),
      updatedAt: normalizeTimestamp(project.updatedAt, timestamp),
      isProvisional: project.id === PROVISIONAL_PROJECT_ID || project.isProvisional === true
    };
  });

  return ensureProvisionalProject(projects);
}
