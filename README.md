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
cd .. && yarn install
```

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
| `e2e/` | Smoke test for a running launcher |
| `scripts/` | Development entry point |

## Testing a running launcher

```
yarn smoke
```

Attaches to the launcher started by `yarn dev` and checks that the UI, the runtime API
and the app catalogue all work.

## Browser automation

`yarn dev` opens a Chrome DevTools Protocol port, so the launcher window can be driven by
Playwright, Puppeteer or Chrome DevTools — useful for screenshots, UI checks and AI
coding agents. The endpoint is printed at startup and written to `.patchkit-dev.json`.

Set `PATCHKIT_CDP_PORT` to choose the port, or `PATCHKIT_CDP_PORT=0` to start without it.

The theme cannot be previewed in a normal browser: it depends on the Electron preload
bridge for all of its data. See [AGENTS.md](AGENTS.md) for the details, along with
guidance written for AI coding agents working in this repository.

## Publishing

See the [SDK documentation](https://docs.patchkit.net/launcher_sdk/) for building and
publishing a launcher. Copy `.env.example` to `.env` and fill in your PatchKit API key
first.
