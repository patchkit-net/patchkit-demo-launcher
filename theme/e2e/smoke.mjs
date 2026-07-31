#!/usr/bin/env node

/**
 * Smoke test for a running launcher. Start the launcher first, then run this against it.
 *
 * It is also a worked example: attaching over CDP, selecting the launcher window,
 * calling the runtime API, and waiting for data instead of sleeping.
 *
 *   node theme/e2e/smoke.mjs
 *   PATCHKIT_CDP_PORT=9333 node theme/e2e/smoke.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const THEME_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT_DIR = resolve(THEME_DIR, "..");

/** Names the command the reader actually has, rather than assuming one. */
function packageManager() {
  if (existsSync(resolve(THEME_DIR, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(resolve(THEME_DIR, "package-lock.json"))) {
    return "npm";
  }
  return "yarn";
}

/** The dev script records the endpoint it started, so it does not have to be guessed. */
function readSessionEndpoint() {
  try {
    const sessionFilePath = resolve(PROJECT_DIR, ".patchkit-dev.json");
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
    `Install the theme dependencies first:  cd ${THEME_DIR} && ${packageManager()} install`,
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

/**
 * Runs one step and reports a thrown error as a failed check. A stack trace would stop
 * the run at the first problem and say less about it than a named failure does.
 */
async function step(label, run) {
  try {
    const { passed, detail } = await run();
    check(label, passed, detail);
  } catch (error) {
    check(label, false, String(error).split("\n")[0]);
  }
}

const browser = await chromium.connectOverCDP(CDP_ENDPOINT).catch(() => undefined);

if (browser === undefined) {
  process.stderr.write([
    `Nothing is listening on ${CDP_ENDPOINT}.`,
    "",
    `Start the launcher first:  cd ${PROJECT_DIR} && ${packageManager()} dev`,
    "If it was started on another port, pass it as PATCHKIT_CDP_PORT.",
    "",
  ].join("\n"));
  process.exit(1);
}

// CDP also exposes the DevTools window and extension pages, so select by URL.
function findLauncherPage() {
  return browser
    .contexts()
    .flatMap((context) => context.pages())
    .find((candidate) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+/.test(candidate.url()));
}

/**
 * The debugging port answers before the window has finished loading the theme, so the
 * page is waited for rather than looked up once — otherwise running this immediately
 * after starting the launcher reports a failure that only means "too early".
 */
async function waitForLauncherPage(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const found = findLauncherPage();

    if (found !== undefined || Date.now() > deadline) {
      return found;
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
}

const page = await waitForLauncherPage(60_000);

check("launcher window attached", page !== undefined, page?.url() ?? "no page serving the theme appeared");

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

await step("preload bridge exposed", async () => {
  const bridge = await page.evaluate(() => ({
    launcherId: window.patchKitLauncherId,
    runtimeVersionLabel: window.patchKitLauncherRuntimeVersionLabel,
    platform: window.patchKitLauncherTargetOperatingSystemPlatform,
    hasBridge: typeof window.sendPatchKitLauncherRuntimeApiFuncRequest === "function",
  }));

  return { passed: bridge.hasBridge === true, detail: JSON.stringify(bridge) };
});

await step("runtime API responds", async () => {
  const displays = await callRuntimeApi("PatchKitLauncher.fetchDisplaysInfo", {});

  return {
    passed: Array.isArray(displays?.execResult) && displays.execResult.length > 0,
    detail: `${String(displays?.execResult?.length ?? 0)} display(s)`,
  };
});

await step("apps catalogue reachable", async () => {
  const apps = await callRuntimeApi("PatchKitLauncher.fetchAppsInfoQueryPageData", {
    appsInfoQueryParams: { pageLimit: 10 },
    appsInfoQueryPageParams: { offset: 0 },
  });

  const appNames = Object.values(apps?.execResult?.appsInfo ?? {}).map((app) => app.name);

  return { passed: appNames.length > 0, detail: appNames.join(", ") };
});

await step("library route reached", async () => {
  // By role, not by text — once the library is open its heading also reads "Library".
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.waitForURL(/library/, { timeout: 10_000 }).catch(() => undefined);

  return { passed: /library/.test(page.url()), detail: page.url() };
});

await step("catalogue tiles rendered", async () => {
  // Wait for the data to arrive rather than for a fixed delay — the catalogue fetch
  // is slower than any sleep worth writing, and a timed screenshot lies convincingly.
  const tiles = page.locator("img[src*='app-catalog-images']");
  await tiles.first().waitFor({ timeout: 30_000 }).catch(() => undefined);

  const count = await tiles.count();

  return { passed: count > 0, detail: `${String(count)} tile(s)` };
});

check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | ") || "none");

await browser.close();

process.stdout.write(`\n${failures.length === 0 ? "SMOKE TEST PASSED" : `SMOKE TEST FAILED: ${failures.join(", ")}`}\n`);
process.exit(failures.length === 0 ? 0 : 1);
