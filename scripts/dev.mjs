#!/usr/bin/env node

/**
 * Starts the launcher in development mode: theme dev server first, then the Electron
 * runtime pointed at it, with a Chrome DevTools Protocol port open so browser
 * automation (Playwright, Chrome DevTools) can attach to the launcher window.
 *
 * Usage:
 *   node scripts/dev.mjs                          CDP on the default port
 *   PATCHKIT_CDP_PORT=9333 node scripts/dev.mjs   CDP on a specific port
 *   PATCHKIT_CDP_PORT=0 node scripts/dev.mjs      CDP off
 *
 * PATCHKIT_ELECTRON_ARGS passes extra arguments to Electron, space separated.
 * Headless Linux environments such as containers and CI usually need
 * --no-sandbox there.
 */

import { spawn, spawnSync } from "node:child_process";
import { connect } from "node:net";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME_DIR = resolve(PROJECT_DIR, "theme");
const RUNTIME_DIR = resolve(PROJECT_DIR, "runtime");

/** Written while the launcher runs so tooling can find it without being told the port. */
const SESSION_FILE_PATH = resolve(PROJECT_DIR, ".patchkit-dev.json");

const DEFAULT_CDP_PORT = 9222;
const THEME_STARTUP_TIMEOUT_MS = 120_000;

const RUNTIME_PRESET_FILE_NAMES = {
  darwin: "macos-prod-preset.ts",
  win32: "windows-prod-preset.ts",
  linux: "linux-prod-preset.ts",
};

const children = [];

function say(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  // Stops whatever already started — otherwise a late failure, such as the runtime
  // refusing to launch, would leave the theme dev server running unattended.
  shutdown();
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

/** Detects the package manager from whichever lockfile the project was created with. */
function detectPackageManager(packageDir) {
  if (existsSync(resolve(packageDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(resolve(packageDir, "package-lock.json"))) {
    return "npm";
  }
  return "yarn";
}

/**
 * Resolves a dependency's entry script so it can be run with this Node executable.
 *
 * Going through the package's own `bin` field rather than `node_modules/.bin` keeps
 * every platform on the same path: no `.cmd` shims, no shell, and therefore no trouble
 * with spaces in directory names. Resolution follows Node, so hoisted and pnpm layouts
 * work too.
 */
function resolveBinScript(packageDir, packageName, binName) {
  const requireFromPackage = createRequire(resolve(packageDir, "package.json"));

  let packageInfoFilePath;

  try {
    packageInfoFilePath = requireFromPackage.resolve(`${packageName}/package.json`);
  } catch {
    fail([
      `Could not find "${packageName}" for ${packageDir}.`,
      "",
      `Install the dependencies first:  cd ${packageDir} && ${detectPackageManager(packageDir)} install`,
    ].join("\n"));
  }

  const packageInfo = JSON.parse(readFileSync(packageInfoFilePath, "utf8"));
  const binField = packageInfo.bin;
  const binRelativePath = typeof binField === "string" ? binField : binField?.[binName];

  if (binRelativePath === undefined) {
    fail(`"${packageName}" does not expose a "${binName}" executable.`);
  }

  const binScriptPath = resolve(dirname(packageInfoFilePath), binRelativePath);

  if (!existsSync(binScriptPath)) {
    fail(`"${packageName}" is installed but ${binScriptPath} is missing — try reinstalling the dependencies.`);
  }

  return binScriptPath;
}

function isPortTaken(port) {
  return new Promise((resolveIsTaken) => {
    const socket = connect({ port, host: "127.0.0.1" });
    const settle = (taken) => {
      socket.destroy();
      resolveIsTaken(taken);
    };
    // A loopback connection either succeeds or is refused immediately, so a timeout is
    // an anomaly. Calling it taken costs a needless message; calling it free would let
    // the launcher report an endpoint that never opens.
    socket.setTimeout(1000);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(true));
    socket.once("error", () => settle(false));
  });
}

/**
 * The debugging port stays where the checked-in MCP configuration expects it. Silently
 * moving to another port would leave that configuration pointing at nothing, and the
 * resulting connection error looks identical to "the launcher is not running" — so a
 * taken port is reported instead of worked around.
 */
async function resolveCdpPort() {
  const requested = process.env.PATCHKIT_CDP_PORT;

  if (requested === "0" || requested === "off") {
    return undefined;
  }

  const port = requested === undefined ? DEFAULT_CDP_PORT : Number.parseInt(requested, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    fail(`PATCHKIT_CDP_PORT must be a port number, "0" or "off" — got "${requested}".`);
  }

  if (await isPortTaken(port)) {
    fail([
      `Port ${port} is already in use — another launcher or a browser is probably running.`,
      "",
      "Pick one:",
      `  - stop whatever holds port ${port}`,
      `  - start on another port:  PATCHKIT_CDP_PORT=${port + 1} <this command>`,
      "    (tooling configured for the default port needs updating to match)",
      "  - start without debugging: PATCHKIT_CDP_PORT=0 <this command>",
    ].join("\n"));
  }

  return port;
}

function run(binScriptPath, args, cwd, { forwardStdin = false } = {}) {
  const child = spawn(process.execPath, [binScriptPath, ...args], {
    cwd,
    // The runtime prints its own keyboard commands, so its input has to reach it —
    // otherwise those instructions are shown and do nothing.
    stdio: [forwardStdin ? "inherit" : "ignore", "pipe", "pipe"],
    env: process.env,
  });

  children.push(child);
  child.stderr.pipe(process.stderr);

  child.on("error", (error) => {
    fail(`Failed to start ${binScriptPath}: ${error.message}`);
  });

  return child;
}

/**
 * The theme falls back to another port when 5173 is taken, so the URL is read from
 * its output instead of assumed — the runtime needs the address it actually bound to.
 */
function startTheme() {
  const child = run(themeBinPath, [], THEME_DIR);

  return new Promise((resolveUrl, rejectUrl) => {
    const timeout = setTimeout(() => {
      rejectUrl(new Error(`The theme dev server did not report a URL within ${THEME_STARTUP_TIMEOUT_MS / 1000}s.`));
    }, THEME_STARTUP_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      process.stdout.write(text);

      // Prefer the address Vite labels as local; fall back to any localhost URL in case
      // that label ever changes, rather than hanging on a format difference.
      const match = /Local:\s+(http:\/\/localhost:\d+)/.exec(text)
        ?? /(http:\/\/localhost:\d+)/.exec(text);

      if (match !== null) {
        clearTimeout(timeout);
        resolveUrl(match[1]);
      }
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);
      rejectUrl(new Error(`The theme dev server exited with code ${String(code)} before it was ready.`));
    });
  });
}

function startRuntime(themeUrl, cdpPort) {
  const presetFileName = RUNTIME_PRESET_FILE_NAMES[process.platform];

  if (presetFileName === undefined) {
    fail(`Unsupported platform "${process.platform}". Supported: macOS, Windows, Linux.`);
  }

  const args = ["-p", presetFileName, "-t", themeUrl];

  const extraElectronArgs = (process.env.PATCHKIT_ELECTRON_ARGS ?? "")
    .split(" ")
    .filter((arg) => arg.length > 0);

  // Everything after `--` is handed to the Electron process untouched by the SDK CLI.
  const electronArgs = [
    ...(cdpPort === undefined ? [] : [`--remote-debugging-port=${String(cdpPort)}`]),
    ...extraElectronArgs,
  ];

  if (electronArgs.length > 0) {
    args.push("--", ...electronArgs);
  }

  const child = run(runtimeBinPath, args, RUNTIME_DIR, { forwardStdin: true });
  child.stdout.pipe(process.stdout);

  return child;
}

function writeSessionFile(themeUrl, cdpPort) {
  writeFileSync(
    SESSION_FILE_PATH,
    `${JSON.stringify(
      {
        themeUrl,
        cdpEndpoint: cdpPort === undefined ? null : `http://localhost:${String(cdpPort)}`,
      },
      null,
      2,
    )}\n`,
  );
}

function shutdown() {
  rmSync(SESSION_FILE_PATH, { force: true });

  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null || child.pid === undefined) {
      continue;
    }

    if (process.platform === "win32") {
      // Signals do not reach a child's own children on Windows, so the Electron process
      // would outlive Ctrl+C. taskkill ends the whole tree, and running it synchronously
      // means it finishes before this process exits.
      const result = spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });

      if (result.error !== undefined) {
        child.kill();
      }
    } else {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

// Resolved up front so a missing install is reported before anything else happens.
const themeBinPath = resolveBinScript(THEME_DIR, "vite", "vite");
const runtimeBinPath = resolveBinScript(
  RUNTIME_DIR,
  "@upsoft/patchkit-basic-launcher-runtime-package-dev-tools",
  "dev-patchkit-basic-launcher-runtime",
);

const cdpPort = await resolveCdpPort();

say("");
say(`Starting the launcher in development mode (${process.platform}).`);
say("");

const themeUrl = await startTheme().catch((error) => {
  shutdown();
  fail(error.message);
});

writeSessionFile(themeUrl, cdpPort);

say("");
say("──────────────────────────────────────────────────────────────");
say(`  Theme          ${themeUrl}`);
if (cdpPort === undefined) {
  say("  CDP endpoint   disabled (PATCHKIT_CDP_PORT=0)");
} else {
  say(`  CDP endpoint   http://localhost:${String(cdpPort)}`);
  say("");
  say("  The launcher window can be screenshotted and clicked through that");
  say("  endpoint — by a coding agent (see AGENTS.md) or by hand with");
  say("  Playwright or Chrome DevTools (see README.md).");
  say("");
  say("  Do not open the theme URL in a plain browser — without the");
  say("  Electron preload bridge the launcher has no runtime to talk to.");
}
say("──────────────────────────────────────────────────────────────");
say("");

const runtime = startRuntime(themeUrl, cdpPort);

runtime.on("exit", (code) => {
  shutdown();
  process.exit(code ?? 0);
});
