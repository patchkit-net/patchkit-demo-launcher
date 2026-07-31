# Working on this launcher

Read this before running or inspecting the app.

## What this project is

A desktop game launcher built with the PatchKit Launcher SDK. Two parts:

- `theme/` — a React app served by Vite. This is the UI.
- `runtime/` — the Electron shell that loads the theme and provides the launcher
  functionality: installing apps, update tasks, disk access, launching games.

The theme is a web page, but **it only works inside the runtime**. Electron injects a
preload bridge (`window.sendPatchKitLauncherRuntimeApiFuncRequest`) that the theme calls
for every piece of data. Nothing else provides it.

## Running it

```
npm run dev
```

One command. It starts the theme dev server, waits for it, then starts the runtime
pointed at it. Stop with Ctrl+C.

The output ends with a block listing the theme URL and a CDP endpoint. Those values are
also written to `.patchkit-dev.json` while the launcher runs, so tooling can read them
instead of guessing.

If the dependencies are missing, the script says which directory to install them in.

## Do not open the theme URL in a browser

Opening `http://localhost:5173` in Chrome or Safari gives you a broken page, not a
preview. Without the preload bridge every data query throws, and because most screens
use Suspense queries, whole sections disappear rather than showing an error. You will be
looking at something that resembles the launcher but proves nothing about it.

To see the real thing, look at the Electron window — via CDP, below.

## Inspecting the running launcher

The runtime opens a Chrome DevTools Protocol port, so the launcher window is automatable
like any web page. Playwright, Puppeteer and Chrome DevTools all speak this protocol.

**With the Playwright MCP server** — this repository ships the configuration, under the
server name `patchkit-launcher`, for the editors that read it from the project:

| Tool | File |
| --- | --- |
| Claude Code | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` |

Tools that only read a global config — Windsurf (`~/.codeium/windsurf/mcp_config.json`)
and Zed (Settings → AI → MCP Servers) — need the same server added there by hand:

```
npx @playwright/mcp@latest --cdp-endpoint http://localhost:9222
```

All of them assume the default port; if the launcher reported a different one, read the
endpoint from `.patchkit-dev.json`.

Two things to expect on the first call:

- **You will not land on the launcher.** The endpoint exposes three tabs — a React
  DevTools background page, the detached DevTools window, and the launcher itself. The
  first one is selected by default and snapshots as an empty page. List the tabs and
  select the one whose URL starts with `http://localhost:` before doing anything else.
- **`ECONNREFUSED` means the launcher is not running**, not that the setup is broken.
  Start it with `npm run dev` and try again.

**From a script** — see `e2e/smoke.mjs` for a worked example. The short version:

```js
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://localhost:9222");

// CDP also exposes the DevTools window and extension pages — select by URL.
const page = browser.contexts()
  .flatMap((context) => context.pages())
  .find((candidate) => candidate.url().startsWith("http://localhost:5173"));

await page.screenshot({ path: "launcher.png" });
```

You can also call the runtime API directly, exactly as the theme does:

```js
const displays = await page.evaluate(() =>
  window.sendPatchKitLauncherRuntimeApiFuncRequest("PatchKitLauncher.fetchDisplaysInfo", {}));
```

## Checking that a change works

```
npm run smoke
```

Attaches to the running launcher and verifies the bridge, the runtime API, the app
catalogue and library navigation. Requires `npm install` in the project root once.

## Two things that will catch you out

**Wait for data, never for time.** The app catalogue is fetched over the network and
rendered through Suspense. A fixed delay produces a screenshot of a half-empty screen
that looks like a bug in your change. Wait for the element that proves the data arrived.

**A missing tile is not always a failure.** A card whose default branch does not exist in
the catalogue is hidden deliberately — see the early return in
`theme/src/components/library/app-card.tsx`. Check the branch before assuming a
regression.

## Ports

| Port | What it is | Attach with |
| --- | --- | --- |
| 5173 | Theme dev server | — |
| 9222 | Renderer, i.e. the launcher window | Playwright, Chrome DevTools |
| 5858 | Electron main process (tasks, installs) | Chrome DevTools via `chrome://inspect` |

Port 9222 shifts to the next free port if it is taken; the startup output and
`.patchkit-dev.json` always carry the real one. Set `PATCHKIT_CDP_PORT` to pick a port,
or `PATCHKIT_CDP_PORT=0` to start without one.

Note that Playwright cannot attach to 5858 — it is a Node inspector, not a browser
target. Pausing there freezes the whole app, unlike a renderer pause.
