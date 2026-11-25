/**
 * Comprobación manual de la función de IA con la clave real de `.env`.
 * No se ejecuta en CI ni en las pruebas automáticas.
 *
 * Uso: npm run smoke:ai
 */
import handler from "../api/generate-palette.ts";

const res = {
  statusCode: 0,
  payload: undefined,
  headers: {},
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  },
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
    return this;
  },
};

const started = Date.now();
await handler(
  {
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1-smoke" },
    body: { prompt: "atardecer mediterráneo, sereno y cálido" },
  },
  res,
);

const elapsed = Date.now() - started;
console.log(`HTTP ${res.statusCode} en ${elapsed} ms`);
console.log(JSON.stringify(res.payload, null, 2));

if (res.statusCode !== 200) {
  process.exitCode = 1;
}
