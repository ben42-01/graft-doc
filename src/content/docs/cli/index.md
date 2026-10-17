---
title: "The Graft CLI"
description: "Run your whole workspace from the terminal: sign in with your browser, then manage records, forms, orders and more."
sidebar:
  order: 0
---

`graft` is Graft from the terminal. Anything the web app can do through the [API](../developers/overview/), the CLI can do, with a sign-in that never asks for your password and commands you can pipe, script and schedule.

```bash
graft login --url https://your-graft-host
graft entities list
graft orders list --json | jq '.[] | select(.status == "pending_payment")'
```

## What it is good for

- **Day-to-day management.** Add a record, confirm an order, publish a form, invite a teammate, without opening the browser.
- **Bulk work.** Page through every submission, export every order, import a CSV, apply the same change to fifty records.
- **Reports and scripts.** `--json` prints exactly what the API returns, so `jq`, spreadsheets and cron jobs work with it directly.
- **Several environments.** Keep separate sign-ins for QA and production and switch with one flag.
- **AI assistants.** The Graft skill uses the CLI as its way in. See [Scripting and automation](./scripting/#ai-assistants).

## Install

You need Node.js 20 or newer. There are no other dependencies.

```bash
npm install -g @graft/cli
graft --version
```

If you work from a checkout of the Graft repository instead, `npm run cli -- <command>` runs the same program from source, and `npm run cli:build` produces the installable build in `cli/dist`.

## A two-minute tour

```bash
graft login --url https://your-graft-host   # approve the one-time code in your browser
graft whoami                                # who and where you are
graft help                                  # the areas and flags
graft commands                              # every command, with its endpoint
graft describe orders transitions           # what one command does, with examples
```

## Where to go next

| If you want to... | Read |
|---|---|
| Sign in, switch workspace or use several servers | [Signing in](./signing-in/) |
| Understand how commands, flags and output work | [Using the CLI](./using/) |
| See real tasks from start to finish | [Walkthrough: run a workspace](./walkthrough/) |
| Script it, use it in CI, or let an assistant use it | [Scripting and automation](./scripting/) |
| Look up one command | [Command reference](./reference/) |
| Fix something that isn't working | [Troubleshooting](./troubleshooting/) |

:::note
The CLI doesn't have a separate feature set. Your role and plan decide what you can do, exactly as in the web app: a member can't apply a template, a Free workspace can't run the sales report. When a command is refused, the message says why.
:::
