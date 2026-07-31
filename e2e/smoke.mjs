#!/usr/bin/env node

/**
 * Smoke test for a running launcher. Start the launcher first (`npm run dev` in the
 * project root), then run this against it.
 *
 * It is also a worked example: attaching over CDP, selecting the launcher window,
 * calling the runtime API, and waiting for data instead of sleeping.
 *
 *   node e2e/smoke.mjs
 *   PATCHKIT_CDP_PORT=9333 node e2e/smoke.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The dev script records the port it actually bound to, which may not be the default. */
function readSessionEndpoint() {
  try {
    const sessionFilePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".patchkit-dev.json");
    return JSON.parse(readFileSync(sessionFilePath, "utf8")).cdpEndpoint ?? undefined;
  } catch {
    return undefined;
  }
}

const CDP_ENDPOINT = process.env.PATCHKIT_CDP_PORT !== undefined
  ? `http://localhost:${process.env.PATCHKIT_CDP_PORT}`
  : readSessionEndpoint() ?? "http://localhost:9222";

let chromium;

try {
  ({ chromium } = await import("playwright-core"));
} catch {
  process.stderr.write([
    "playwright-core is not installed.",
    "",
    "Install the root dependencies first:  npm install",
    "",
  ].join("\n"));
  process.exit(1);
}

const failures = [];

function check(label, passed, detail) {
  process.stdout.write(`${passed ? "PASS" : "FAIL"}  ${label}${detail === undefined ? "" : ` — ${detail}`}\n`);
  if (!passed) {
    failures.push(label);
  }
}

const browser = await chromium.connectOverCDP(CDP_ENDPOINT).catch(() => undefined);

if (browser === undefined) {
  process.stderr.write([
    `Nothing is listening on ${CDP_ENDPOINT}.`,
    "",
    "Start the launcher first:  npm run dev",
    "If it reported a different port, pass it as PATCHKIT_CDP_PORT.",
    "",
  ].join("\n"));
  process.exit(1);
}

// CDP also exposes the DevTools window and extension pages, so select by URL.
const page = browser
  .contexts()
  .flatMap((context) => context.pages())
  .find((candidate) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+/.test(candidate.url()));

check("launcher window attached", page !== undefined, page?.url());

if (page === undefined) {
  await browser.close();
  process.exit(1);
}

const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") {
    pageErrors.push(message.text());
  }
});

/** Calls a runtime API function the same way the theme does. */
async function callRuntimeApi(funcFullname, args) {
  return page.evaluate(
    ([name, execArgs]) => window.sendPatchKitLauncherRuntimeApiFuncRequest(name, execArgs),
    [funcFullname, args],
  );
}

const bridge = await page.evaluate(() => ({
  launcherId: window.patchKitLauncherId,
  runtimeVersionLabel: window.patchKitLauncherRuntimeVersionLabel,
  platform: window.patchKitLauncherTargetOperatingSystemPlatform,
  hasBridge: typeof window.sendPatchKitLauncherRuntimeApiFuncRequest === "function",
}));

check("preload bridge exposed", bridge.hasBridge === true, JSON.stringify(bridge));

const displays = await callRuntimeApi("PatchKitLauncher.fetchDisplaysInfo", {});

check(
  "runtime API responds",
  Array.isArray(displays?.execResult) && displays.execResult.length > 0,
  `${String(displays?.execResult?.length ?? 0)} display(s)`,
);

const apps = await callRuntimeApi("PatchKitLauncher.fetchAppsInfoQueryPageData", {
  appsInfoQueryParams: { pageLimit: 10 },
  appsInfoQueryPageParams: { offset: 0 },
});

const appNames = Object.values(apps?.execResult?.appsInfo ?? {}).map((app) => app.name);

check("apps catalogue reachable", appNames.length > 0, appNames.join(", "));

// By role, not by text — once the library is open its heading also reads "Library".
await page.getByRole("button", { name: "Library", exact: true }).click();
await page.waitForURL(/library/, { timeout: 10_000 }).catch(() => undefined);

check("library route reached", /library/.test(page.url()), page.url());

// Wait for the data to arrive rather than for a fixed delay — the catalogue fetch
// is slower than any sleep worth writing, and a timed screenshot lies convincingly.
const tiles = page.locator("img[src*='app-catalog-images']");
await tiles.first().waitFor({ timeout: 30_000 }).catch(() => undefined);

check("catalogue tiles rendered", (await tiles.count()) > 0, `${String(await tiles.count())} tile(s)`);

check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | ") || "none");

await browser.close();

process.stdout.write(`\n${failures.length === 0 ? "SMOKE TEST PASSED" : `SMOKE TEST FAILED: ${failures.join(", ")}`}\n`);
process.exit(failures.length === 0 ? 0 : 1);
