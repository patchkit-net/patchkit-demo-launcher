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

/** A launcher started without a debugging port: running, but nothing to attach to. */
const CDP_DISABLED = "disabled";

/** The dev script records the endpoint it started, so it does not have to be guessed. */
function readSessionEndpoint() {
  try {
    const sessionFilePath = resolve(PROJECT_DIR, ".patchkit-dev.json");
    const { cdpEndpoint } = JSON.parse(readFileSync(sessionFilePath, "utf8"));

    // A recorded `null` is the dev script saying the port was switched off — a different
    // situation from no session file, and one the default port would misreport.
    return cdpEndpoint === null ? CDP_DISABLED : cdpEndpoint ?? undefined;
  } catch {
    return undefined;
  }
}

/** Reads PATCHKIT_CDP_PORT the way the dev script does, "off" and "0" included. */
function resolveCdpEndpoint() {
  const requested = process.env.PATCHKIT_CDP_PORT;

  if (requested === "0" || requested === "off") {
    return CDP_DISABLED;
  }

  if (requested !== undefined) {
    return `http://localhost:${requested}`;
  }

  return readSessionEndpoint() ?? "http://localhost:9222";
}

const CDP_ENDPOINT = resolveCdpEndpoint();

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
const skips = [];

function check(label, passed, detail) {
  process.stdout.write(`${passed ? "PASS" : "FAIL"}  ${label}${detail === undefined ? "" : ` — ${detail}`}\n`);
  if (!passed) {
    failures.push(label);
  }
}

function skip(label, reason) {
  process.stdout.write(`SKIP  ${label} — ${reason}\n`);
  skips.push(label);
}

/**
 * Runs one step and reports a thrown error as a failed check. A stack trace would stop
 * the run at the first problem and say less about it than a named failure does.
 *
 * Returning `{ skipped, detail }` marks the step as not applicable rather than failed.
 */
async function step(label, run) {
  try {
    const { passed, detail, skipped } = await run();

    if (skipped === true) {
      skip(label, detail);
      return;
    }

    check(label, passed, detail);
  } catch (error) {
    check(label, false, String(error).split("\n")[0]);
  }
}

if (CDP_ENDPOINT === CDP_DISABLED) {
  process.stderr.write([
    "The launcher was started with its debugging port switched off (PATCHKIT_CDP_PORT=0),",
    "so there is no endpoint to attach to.",
    "",
    `Restart it without that variable:  cd ${PROJECT_DIR} && ${packageManager()} dev`,
    "",
  ].join("\n"));
  process.exit(1);
}

/**
 * The dev script writes the session file before Electron opens the port it names, so the
 * endpoint can be known a moment before it answers. Connecting once would report a
 * launcher that is still booting as one that is not running — the same "too early"
 * mistake waitForLauncherPage below exists to avoid.
 */
async function connectWithRetry(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const connected = await chromium.connectOverCDP(CDP_ENDPOINT).catch(() => undefined);

    if (connected !== undefined || Date.now() > deadline) {
      return connected;
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
}

const browser = await connectWithRetry(30_000);

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

/**
 * Whether a session can be established without real credentials. The template ships a
 * mock user provider that accepts anything; a project that switches to another one cannot
 * be signed into from here, and the checks that need a session are skipped there instead.
 */
function usesMockUserProvider() {
  try {
    const source = readFileSync(resolve(THEME_DIR, "src/customization.ts"), "utf8");
    return /userProviderType:\s*"mock"/.test(source);
  } catch {
    return false;
  }
}

/**
 * A launcher with no stored session opens on the sign-in screen, which is what a freshly
 * created project does — so signing in is part of the smoke test rather than a reason to
 * skip the only checks that exercise the UI.
 */
async function signIn() {
  if (!/user-is-not-authenticated/.test(page.url())) {
    return true;
  }

  // Any credentials work against the mock provider except the literal sentinels it uses
  // to simulate a rejection and a failure.
  await page.fill("#email", "smoke@example.com");
  await page.fill("#password", "smoke");
  await page.getByRole("button", { name: "Login", exact: true }).click({ timeout: 10_000 });
  await page
    .waitForURL((url) => !/user-is-not-authenticated/.test(url.toString()), { timeout: 15_000 })
    .catch(() => undefined);

  return !/user-is-not-authenticated/.test(page.url());
}

let isSignedIn = false;

await step("signed in", async () => {
  if (!usesMockUserProvider()) {
    return { skipped: true, detail: "the theme is configured with a non-mock user provider" };
  }

  isSignedIn = await signIn();

  return { passed: isSignedIn, detail: page.url() };
});

await step("library route reached", async () => {
  if (!isSignedIn) {
    return { skipped: true, detail: "no session — see the sign-in check above" };
  }

  // By role, not by text — once the library is open its heading also reads "Library".
  await page.getByRole("button", { name: "Library", exact: true }).click({ timeout: 10_000 });
  await page.waitForURL(/library/, { timeout: 10_000 }).catch(() => undefined);

  return { passed: /library/.test(page.url()), detail: page.url() };
});

await step("catalogue tiles rendered", async () => {
  if (!isSignedIn) {
    return { skipped: true, detail: "no session — see the sign-in check above" };
  }

  // Wait for the data to arrive rather than for a fixed delay — the catalogue fetch
  // is slower than any sleep worth writing, and a timed screenshot lies convincingly.
  const tiles = page.locator("img[src*='app-catalog-images']");
  await tiles.first().waitFor({ timeout: 30_000 }).catch(() => undefined);

  const count = await tiles.count();

  return { passed: count > 0, detail: `${String(count)} tile(s)` };
});

check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | ") || "none");

await browser.close();

// A run with skipped checks covers less than a full one, so the summary says so —
// otherwise a reduced run and a complete one print the same line and exit the same way.
const summary = failures.length === 0
  ? `SMOKE TEST PASSED${skips.length === 0 ? "" : ` (${String(skips.length)} skipped: ${skips.join(", ")})`}`
  : `SMOKE TEST FAILED: ${failures.join(", ")}`;

process.stdout.write(`\n${summary}\n`);
process.exit(failures.length === 0 ? 0 : 1);
