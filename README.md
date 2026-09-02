# PatchKit Demo Launcher

A demonstration game launcher built with the [PatchKit Launcher SDK](https://docs.patchkit.net/launcher_sdk/),
and the template every new project created with `yarn create @upsoft/patchkit-launcher-sdk-project`
starts from.

## Requirements

- Node.js 22 or newer
- Yarn, npm or pnpm

## Getting started

Install the dependencies:

```
cd runtime && yarn install
cd ../theme && yarn install
```

A project created with the setup wizard already has these installed. Commands in this
file use yarn because that is the project default — substitute `npm run` or `pnpm` if you
chose one of those.

Start the launcher:

```
yarn dev
```

This starts the theme dev server and then the Electron runtime pointed at it. The
launcher window opens on your desktop. Stop everything with Ctrl+C.

## Project layout

| Path | What it holds |
| --- | --- |
| `theme/` | The React UI, served by Vite in development |
| `runtime/` | Electron runtime configuration and build presets |
| `theme/e2e/` | Smoke test for a running launcher |
| `scripts/` | Development entry point |

## Testing a running launcher

```
yarn smoke
```

Attaches to the launcher started by `yarn dev` and checks that the UI, the runtime API
and the app catalogue all work. It signs itself in through the mock user provider the
template ships, so the checks that need a session run on a fresh checkout too.

## Inspecting the running launcher

`yarn dev` opens a Chrome DevTools Protocol port, so the launcher window can be
screenshotted, clicked and queried from outside. The endpoint is printed at startup and
written to `.patchkit-dev.json`.

**With Chrome DevTools** — open `http://localhost:9222` in Chrome and pick the page
served from the theme URL in `.patchkit-dev.json`. The runtime also opens a DevTools
window of its own on startup in development mode.

**With Playwright** — connect to the endpoint instead of launching a browser:

```js
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://localhost:9222");

// The endpoint also exposes the DevTools window and extension pages — select by URL.
// Match any localhost port: the theme moves off 5173 whenever that port is taken.
const page = browser.contexts()
  .flatMap((context) => context.pages())
  .find((candidate) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+/.test(candidate.url()));

await page.screenshot({ path: "launcher.png" });
```

`theme/e2e/smoke.mjs` is a longer worked example, including how to call the launcher's
own runtime API from a script.

**With an AI coding agent** — MCP configuration is checked in for editors that read it
from the project directory, so no setup is needed. See [AGENTS.md](AGENTS.md), which
also covers the traps worth knowing before trusting what an agent reports.

The port is fixed at 9222 so that checked-in tooling configuration keeps working; if it
is already in use the launcher stops with an explanation instead of quietly moving
elsewhere. `PATCHKIT_CDP_PORT` overrides it, and `PATCHKIT_CDP_PORT=0` starts without it.
`PATCHKIT_ELECTRON_ARGS` passes extra arguments to Electron, which headless Linux
environments need — see below. It is space separated, so an argument containing a space
has to be given as a JSON array instead:
`PATCHKIT_ELECTRON_ARGS='["--user-data-dir=/Users/Jane Doe/data"]'`.

Note that the theme cannot be previewed in a normal browser: it depends on the Electron
preload bridge for all of its data, so outside the runtime every screen that shows data
collapses.

### Headless Linux

The launcher is a desktop application, so a container or CI runner needs a display and a
relaxed Electron sandbox:

```
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99
export PATCHKIT_ELECTRON_ARGS="--no-sandbox --disable-dev-shm-usage"
yarn dev
```

Electron also needs its own system libraries there — on Debian and Ubuntu: `libgtk-3-0`,
`libnss3`, `libnotify4`, `libxss1`, `libxtst6`, `libatspi2.0-0`, `libdrm2`, `libgbm1`,
`libasound2`.

## Publishing

See the [SDK documentation](https://docs.patchkit.net/launcher_sdk/) for building and
publishing a launcher. Copy `.env.example` to `.env` and fill in your PatchKit API key
first.
