import { appendFileSync, existsSync, readFileSync } from "node:fs";

const reportPath = "e2e-results.json";
if (!existsSync(reportPath)) {
  console.log("No hay e2e-results.json; no se puede resumir el fallo.");
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const failures = [];

function collect(suite) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const failed = (test.results ?? []).filter(
        (result) => result.status === "failed" || result.status === "timedOut",
      );
      if (failed.length > 0) {
        failures.push({
          title: spec.title,
          file: spec.file,
          message: failed[0]?.error?.message ?? failed[0]?.status ?? "fallo sin detalle",
        });
      }
    }
  }
  for (const child of suite.suites ?? []) collect(child);
}

for (const suite of report.suites ?? []) collect(suite);

const firstLine = (value) =>
  String(value ?? "")
    .split("\n")[0]
    .slice(0, 300);
const summary = [
  "## Fallos E2E",
  "",
  ...(failures.length > 0
    ? failures.map(
        (failure) => `- **${failure.title}** (${failure.file}): ${firstLine(failure.message)}`,
      )
    : ["Sin fallos identificables en el informe JSON."]),
  "",
].join("\n");

appendFileSync(process.env.GITHUB_STEP_SUMMARY ?? "e2e-summary.md", summary);
for (const failure of failures) {
  console.log(`::error::${failure.title}: ${firstLine(failure.message)}`);
}
console.log(summary);
