#!/usr/bin/env node

/**
 * Starts the launcher in development mode: theme dev server first, then the Electron
 * runtime pointed at it, with a Chrome DevTools Protocol port open so browser
 * automation (Playwright, Chrome DevTools) can attach to the launcher window.
 *
 * Usage:
 *   node scripts/dev.mjs                    CDP on the default port
 *   PATCHKIT_CDP_PORT=9333 node scripts/dev.mjs   CDP on a specific port
 *   PATCHKIT_CDP_PORT=0 node scripts/dev.mjs      CDP off
 */

import { spawn } from "node:child_process";
import { connect } from "node:net";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME_DIR = resolve(PROJECT_DIR, "theme");
const RUNTIME_DIR = resolve(PROJECT_DIR, "runtime");

/** Written while the launcher runs so tooling can find it without being told the port. */
const SESSION_FILE_PATH = resolve(PROJECT_DIR, ".patchkit-dev.json");

const DEFAULT_CDP_PORT = 9222;
const CDP_PORT_SEARCH_LIMIT = 10;
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
 * Local binaries are invoked directly rather than through `<pm> run`, so argument
 * forwarding does not depend on package manager behaviour.
 */
function resolveBin(packageDir, binName) {
  const binDir = resolve(packageDir, "node_modules", ".bin");
  const candidates = process.platform === "win32"
    ? [resolve(binDir, `${binName}.cmd`), resolve(binDir, `${binName}.ps1`), resolve(binDir, binName)]
    : [resolve(binDir, binName)];

  const found = candidates.find((candidate) => existsSync(candidate));

  if (found === undefined) {
    fail([
      `Could not find "${binName}" in ${packageDir}.`,
      "",
      `Install the dependencies first:  cd ${packageDir} && ${detectPackageManager(packageDir)} install`,
    ].join("\n"));
  }

  return found;
}

function isPortTaken(port) {
  return new Promise((resolveIsTaken) => {
    const socket = connect({ port, host: "127.0.0.1" });
    const settle = (taken) => {
      socket.destroy();
      resolveIsTaken(taken);
    };
    socket.setTimeout(700);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

/**
 * Keeps the happy path on the default port so a checked-in MCP config stays valid,
 * and falls back to the next free one rather than starting without CDP.
 */
async function resolveCdpPort() {
  const requested = process.env.PATCHKIT_CDP_PORT;

  if (requested === "0" || requested === "off") {
    return undefined;
  }

  const preferred = requested === undefined ? DEFAULT_CDP_PORT : Number.parseInt(requested, 10);

  if (!Number.isInteger(preferred) || preferred < 1 || preferred > 65535) {
    fail(`PATCHKIT_CDP_PORT must be a port number, "0" or "off" — got "${requested}".`);
  }

  for (let port = preferred; port < preferred + CDP_PORT_SEARCH_LIMIT; port += 1) {
    if (!(await isPortTaken(port))) {
      if (port !== preferred) {
        say("");
        say(`! Port ${preferred} is already in use — another launcher or a browser is likely running.`);
        say(`  Using port ${port} instead. Point your tooling at it, for example:`);
        say(`    npx @playwright/mcp --cdp-endpoint http://localhost:${port}`);
      }
      return port;
    }
  }

  fail(`No free port found between ${preferred} and ${preferred + CDP_PORT_SEARCH_LIMIT - 1}.`);
}

function run(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: process.env,
  });

  children.push(child);
  child.stderr.pipe(process.stderr);

  child.on("error", (error) => {
    fail(`Failed to start "${command}": ${error.message}`);
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

      const match = /(http:\/\/localhost:\d+)/.exec(text);
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

  // Everything after `--` is handed to the Electron process untouched by the SDK CLI.
  if (cdpPort !== undefined) {
    args.push("--", `--remote-debugging-port=${String(cdpPort)}`);
  }

  const child = run(runtimeBinPath, args, RUNTIME_DIR);
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
    if (child.exitCode === null && child.signalCode === null) {
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
const themeBinPath = resolveBin(THEME_DIR, "vite");
const runtimeBinPath = resolveBin(RUNTIME_DIR, "dev-patchkit-basic-launcher-runtime");

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
  say("  The launcher window is automatable over that endpoint.");
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
