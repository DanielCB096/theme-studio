/**
 * Verificación de RLS con dos usuarios reales.
 *
 * - Crea dos cuentas de prueba (emails `@example.com`, no reciben correo).
 * - A guarda un tema privado y otro público.
 * - Comprueba que B no ve el privado de A, sí el público, y no puede
 *   modificarlo ni borrarlo ni insertar filas a nombre de A.
 * - Limpia los temas creados.
 *
 * Requiere «Confirm email» desactivado en Supabase para que signUp devuelva sesión.
 * Uso: node --env-file=.env scripts/verify-rls.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const stamp = Date.now();
const password = `e2e-${stamp}-Aa1!`;
const themeData = (name) => ({
  id: crypto.randomUUID(),
  name,
  mode: "light",
  colors: {
    primary: "#2563eb",
    secondary: "#7c3aed",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    success: "#15803d",
    danger: "#dc2626",
  },
  typography: { fontFamily: "system", baseSize: 16, scale: 1.25 },
  shape: { radius: 10, borderWidth: 1 },
  spacing: { unit: 4 },
  components: { buttonSize: "md", density: "comfortable" },
});

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function client() {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function createUser(label) {
  const supabase = client();
  const email = `theme-studio-e2e-${label}-${stamp}@example.com`;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(`signUp ${label}: ${error.message}`);
  if (!data.session) {
    throw new Error(
      "signUp no devolvió sesión: desactiva «Confirm email» en Authentication → Providers → Email.",
    );
  }
  return { supabase, email, userId: data.user.id };
}

try {
  const a = await createUser("a");
  const b = await createUser("b");

  const { data: privateTheme, error: privateError } = await a.supabase
    .from("themes")
    .insert({
      user_id: a.userId,
      name: `Privado A ${stamp}`,
      data: themeData(`Privado A ${stamp}`),
      is_public: false,
    })
    .select("id, name")
    .single();
  if (privateError) throw new Error(`insert privado: ${privateError.message}`);

  const { data: publicTheme, error: publicError } = await a.supabase
    .from("themes")
    .insert({
      user_id: a.userId,
      name: `Público A ${stamp}`,
      data: themeData(`Público A ${stamp}`),
      is_public: true,
    })
    .select("id, name")
    .single();
  if (publicError) throw new Error(`insert público: ${publicError.message}`);

  check("A lee sus dos temas", true, "insert devolvió filas");

  const { data: aOwn } = await a.supabase.from("themes").select("id").eq("user_id", a.userId);
  check("A ve exactamente sus 2 temas", (aOwn ?? []).length === 2, `filas: ${(aOwn ?? []).length}`);

  const { data: bVisible } = await b.supabase
    .from("themes")
    .select("id, name, is_public")
    .eq("user_id", a.userId);
  const bNames = (bVisible ?? []).map((row) => row.name);
  check(
    "B no ve el tema privado de A",
    !bNames.includes(privateTheme.name),
    `visibles: ${bNames.join(", ") || "ninguno"}`,
  );
  check(
    "B sí ve el tema público de A",
    bNames.includes(publicTheme.name),
    `visibles: ${bNames.join(", ") || "ninguno"}`,
  );

  const { data: afterUpdate } = await b.supabase
    .from("themes")
    .update({ name: "secuestrado por B" })
    .eq("id", privateTheme.id)
    .select("id");
  check("B no puede actualizar el privado de A", (afterUpdate ?? []).length === 0);

  const { data: afterDelete } = await b.supabase
    .from("themes")
    .delete()
    .eq("id", privateTheme.id)
    .select("id");
  check("B no puede borrar el privado de A", (afterDelete ?? []).length === 0);

  const { error: forgeError } = await b.supabase.from("themes").insert({
    user_id: a.userId,
    name: "intento de B",
    data: themeData("intento de B"),
  });
  check("B no puede insertar a nombre de A", forgeError !== null, forgeError?.code ?? "sin error");

  const { data: stillThere } = await a.supabase
    .from("themes")
    .select("id, name")
    .eq("id", privateTheme.id)
    .maybeSingle();
  check("El tema privado de A sigue intacto", stillThere?.name === privateTheme.name);

  const anon = client();
  const { data: anonVisible } = await anon
    .from("themes")
    .select("id, name")
    .eq("user_id", a.userId);
  const anonNames = (anonVisible ?? []).map((row) => row.name);
  check(
    "Anon solo ve el tema público",
    anonNames.length === 1 && anonNames[0] === publicTheme.name,
    `visibles: ${anonNames.join(", ") || "ninguno"}`,
  );

  // --- Páginas (Anexo A) -------------------------------------------------
  const pageDoc = (name) => ({ version: 1, name, theme: themeData(name), rootIds: [], blocks: {} });

  const { data: privatePage, error: privatePageError } = await a.supabase
    .from("pages")
    .insert({
      user_id: a.userId,
      name: `Página privada A ${stamp}`,
      slug: `rls-privada-${stamp}`,
      data: pageDoc(`Página privada A ${stamp}`),
      theme: themeData(`Página privada A ${stamp}`),
      is_public: false,
    })
    .select("id, name, slug")
    .single();
  if (privatePageError) throw new Error(`insert página privada: ${privatePageError.message}`);

  const { data: publicPage, error: publicPageError } = await a.supabase
    .from("pages")
    .insert({
      user_id: a.userId,
      name: `Página pública A ${stamp}`,
      slug: `rls-publica-${stamp}`,
      data: pageDoc(`Página pública A ${stamp}`),
      theme: themeData(`Página pública A ${stamp}`),
      is_public: true,
    })
    .select("id, name, slug")
    .single();
  if (publicPageError) throw new Error(`insert página pública: ${publicPageError.message}`);

  const { data: bPages } = await b.supabase
    .from("pages")
    .select("id, name, is_public")
    .eq("user_id", a.userId);
  const bPageNames = (bPages ?? []).map((row) => row.name);
  check(
    "B no ve la página privada de A",
    !bPageNames.includes(privatePage.name),
    `visibles: ${bPageNames.join(", ") || "ninguno"}`,
  );
  check(
    "B sí ve la página pública de A",
    bPageNames.includes(publicPage.name),
    `visibles: ${bPageNames.join(", ") || "ninguno"}`,
  );

  const { data: pageUpdate } = await b.supabase
    .from("pages")
    .update({ name: "secuestrada por B" })
    .eq("id", privatePage.id)
    .select("id");
  check("B no puede actualizar la página privada de A", (pageUpdate ?? []).length === 0);

  const { data: pageDelete } = await b.supabase
    .from("pages")
    .delete()
    .eq("id", privatePage.id)
    .select("id");
  check("B no puede borrar la página privada de A", (pageDelete ?? []).length === 0);

  const { data: anonPages } = await anon.from("pages").select("id, name").eq("user_id", a.userId);
  const anonPageNames = (anonPages ?? []).map((row) => row.name);
  check(
    "Anon solo ve la página pública",
    anonPageNames.length === 1 && anonPageNames[0] === publicPage.name,
    `visibles: ${anonPageNames.join(", ") || "ninguno"}`,
  );

  // --- Respuestas de formulario (Hito 2A) --------------------------------
  const { error: anonSubmitError } = await anon
    .from("page_submissions")
    .insert({ page_id: publicPage.id, data: { Nombre: "Visitante" } });
  check(
    "Anon puede responder en una página pública",
    !anonSubmitError,
    anonSubmitError?.message ?? "",
  );

  const { error: privateSubmitError } = await anon
    .from("page_submissions")
    .insert({ page_id: privatePage.id, data: { Nombre: "Intruso" } });
  check(
    "Anon no puede responder en una página privada",
    Boolean(privateSubmitError),
    privateSubmitError?.message ?? "la inserción se permitió",
  );

  const { data: anonSubmissions } = await anon
    .from("page_submissions")
    .select("id")
    .eq("page_id", publicPage.id);
  const anonSubmissionRows = anonSubmissions ?? [];
  check(
    "Anon no puede leer las respuestas",
    anonSubmissionRows.length === 0,
    `filas: ${anonSubmissionRows.length}`,
  );

  const { data: ownerSubmissions } = await a.supabase
    .from("page_submissions")
    .select("id")
    .eq("page_id", publicPage.id);
  const ownerSubmissionRows = ownerSubmissions ?? [];
  check(
    "A lee las respuestas de su página",
    ownerSubmissionRows.length === 1,
    `filas: ${ownerSubmissionRows.length}`,
  );

  const { data: strangerSubmissions } = await b.supabase
    .from("page_submissions")
    .select("id")
    .eq("page_id", publicPage.id);
  const strangerSubmissionRows = strangerSubmissions ?? [];
  check(
    "B no ve las respuestas de A",
    strangerSubmissionRows.length === 0,
    `filas: ${strangerSubmissionRows.length}`,
  );

  const submissionId = ownerSubmissionRows[0]?.id;
  if (submissionId) {
    const { data: strangerUpdate } = await b.supabase
      .from("page_submissions")
      .update({ read_at: new Date().toISOString() })
      .eq("id", submissionId)
      .select("id");
    check("B no puede modificar respuestas de A", (strangerUpdate ?? []).length === 0);

    const { data: strangerDelete } = await b.supabase
      .from("page_submissions")
      .delete()
      .eq("id", submissionId)
      .select("id");
    check("B no puede borrar respuestas de A", (strangerDelete ?? []).length === 0);
  } else {
    check("B no puede modificar respuestas de A", false, "falta la respuesta de prueba");
    check("B no puede borrar respuestas de A", false, "falta la respuesta de prueba");
  }

  // Limpieza: cada usuario borra lo suyo.
  await a.supabase.from("pages").delete().eq("user_id", a.userId);
  await b.supabase.from("pages").delete().eq("user_id", b.userId);
  await a.supabase.from("themes").delete().eq("user_id", a.userId);
  await b.supabase.from("themes").delete().eq("user_id", b.userId);

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas.`);
  console.log(`Usuarios de prueba: ${a.email} y ${b.email} (puedes borrarlos desde el dashboard).`);
  process.exit(failed.length === 0 ? 0 : 1);
} catch (error) {
  console.error(`\nERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
