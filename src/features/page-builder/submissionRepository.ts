import { z } from "zod";

import { requireSupabase } from "@/lib/supabase";

export interface PageSubmission {
  id: string;
  data: Record<string, string>;
  createdAt: string;
  readAt: string | null;
  userAgent: string | null;
}

const SUBMISSION_SELECT = "id, data, created_at, read_at, user_agent";

const submissionDataSchema = z
  .record(z.string().max(2000))
  .refine((data) => Object.keys(data).length >= 1 && Object.keys(data).length <= 12);

interface SubmissionRow {
  id: string;
  data: unknown;
  created_at: string;
  read_at: string | null;
  user_agent: string | null;
}

export function submissionFromRow(row: SubmissionRow): PageSubmission {
  const parsed = submissionDataSchema.safeParse(row.data);
  if (!parsed.success) {
    throw new Error("Una respuesta tiene datos dañados o incompletos.");
  }
  return {
    id: row.id,
    data: parsed.data,
    createdAt: row.created_at,
    readAt: row.read_at,
    userAgent: row.user_agent,
  };
}

export async function listSubmissions(pageId: string): Promise<PageSubmission[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("page_submissions")
    .select(SUBMISSION_SELECT)
    .eq("page_id", pageId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => submissionFromRow(row));
}

export async function markSubmissionRead(id: string, read: boolean): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("page_submissions")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteSubmission(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from("page_submissions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Columnas ordenadas alfabéticamente: `jsonb` no conserva el orden del formulario. */
export function submissionFieldColumns(rows: PageSubmission[]): string[] {
  const seen = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row.data)) seen.add(key);
  }

  return [...seen].sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Neutraliza fórmulas al abrir el CSV en una hoja de cálculo: un valor que
 * empieza por =, +, -, @, tabulador o retorno puede ejecutarse como fórmula.
 */
function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeCsv(value: string): string {
  const safe = sanitizeCsvCell(value);
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * CSV sin BOM: primera columna `Fecha` (ISO) y después la unión de campos.
 * Comillas, comas y saltos de línea se escapan según RFC 4180.
 */
export function submissionsToCsv(rows: PageSubmission[]): string {
  const fields = submissionFieldColumns(rows);
  const header = ["Fecha", ...fields];
  const lines = [
    header,
    ...rows.map((row) => [row.createdAt, ...fields.map((field) => row.data[field] ?? "")]),
  ];

  return lines.map((cells) => cells.map(escapeCsv).join(",")).join("\r\n");
}
