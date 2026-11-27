import { appendFileSync } from "node:fs";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const email = "theme-studio-e2e@example.com";
const password = "theme-studio-e2e-Aa1";

const lines = ["## Comprobación de Supabase para E2E", ""];

function finish(ok, detail) {
  lines.push(`- URL: ${url || "(vacía)"}`);
  lines.push(`- Clave anon: ${key ? "presente" : "vacía"}`);
  lines.push(`- Resultado: ${detail}`);
  const summary = `${lines.join("\n")}\n`;
  appendFileSync(process.env.GITHUB_STEP_SUMMARY ?? "ci-supabase-summary.md", summary);
  console.log(summary);
  if (!ok) {
    console.log(`::error::Supabase E2E (${url || "sin URL"}): ${detail}`);
    process.exit(1);
  }
  console.log(`::notice::Supabase E2E OK (${url}).`);
}

if (!url || !key) {
  const message =
    "faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en los secretos; las pruebas que necesitan Supabase se omitirán.";
  const summary = `## Comprobación de Supabase para E2E\n\n- ${message}\n`;
  appendFileSync(process.env.GITHUB_STEP_SUMMARY ?? "ci-supabase-summary.md", summary);
  console.log(summary);
  console.log(`::warning::${message}`);
  process.exit(0);
}

let response;
try {
  response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ email, password }),
  });
} catch (error) {
  finish(false, `no se pudo conectar: ${error instanceof Error ? error.message : "error"}`);
}

const text = await response.text();
let detail = "";
try {
  const payload = JSON.parse(text);
  detail = payload.error_description ?? payload.msg ?? payload.error ?? "";
} catch {
  detail = text.slice(0, 200);
}

if (response.status === 200) {
  finish(true, "login de la cuenta E2E correcto.");
}

// 400 suele significar que la cuenta aún no existe: el setup la crea.
if (response.status === 400) {
  finish(
    true,
    `la cuenta E2E no existe todavía (${detail || "credenciales"}), el setup la creará.`,
  );
}

finish(false, `HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
