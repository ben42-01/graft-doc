---
title: "Troubleshooting"
description: "Fixes for the common CLI problems: sign-in, workspaces, refused requests and scripts."
sidebar:
  order: 5
---

When something fails, the CLI prints the error code, the message, any per-field reasons and a **request id**. Quote the request id to support; it finds the exact call. For what each exit code means, see [Using the CLI](../using/#errors-and-exit-codes).

## Signing in

### `Which Graft? Run graft login --url …`

The first sign-in needs a server address.

```bash
graft login --url https://your-graft-host
```

The URL must start with `https://` (or `http://` for a local server).

### `The code expired before it was approved`

A code lasts 10 minutes and works once. Run `graft login` again and approve the new code. If it says the request was **denied**, someone chose Deny in the browser.

### The browser opened, but the code isn't accepted

- Type the code exactly as the terminal shows it. It isn't pre-filled on purpose.
- Make sure you're signed in to the **same server** the CLI is pointed at (`graft profiles` shows it).

### No browser opens

Normal over ssh, in CI, or with `GRAFT_NO_BROWSER=1`. Open the printed link on any device and type the code there.

### Signed out unexpectedly

- A session ends if you ran `graft logout`, or if the 30-day refresh token lapsed because the profile wasn't used. Run `graft login`.
- **Don't copy `config.json` to another machine.** A refresh token used twice is treated as theft and the whole session ends. Sign in separately on each machine.

### `Not signed in` (exit code 3)

```bash
graft whoami
```

Tells you whether the profile has a session. Check you're using the profile you think you are: `--profile` and `GRAFT_PROFILE` both apply.

## Workspaces and servers

### `You are not a member of a workspace called '…'`

```bash
graft workspace list
```

Use a slug, an id or the exact name from that list.

### Commands hit the wrong server

`GRAFT_URL` overrides the profile's server, and `GRAFT_PROFILE` picks the default profile. `graft profiles` shows what's saved; `graft whoami` shows what this command would use.

### `fetch failed` or `ECONNREFUSED` (exit code 6)

The CLI can't reach the server. Check the URL, your network and whether the server is up. `https://your-graft-host/api/health` should answer.

## Refused requests

### `FORBIDDEN` (exit code 4)

Your role can't do this. Examples: a member applying a template, changing a form or managing the team. An owner can change your role. If `GRAFT_READONLY=1` is set, every change is refused; unset it.

### `FEATURE_NOT_AVAILABLE` or a refusal naming a feature

Your plan doesn't include it: the sales report and usage chart need `reports`, importing needs `csv_import`. `graft me get --json | jq .tenant.features` lists what you have. See [Plans and limits](../../guide/plans/).

### `QUOTA_EXCEEDED`

You've used up a limit. The details name the `meter`. Check it with `graft meters get <meter>`.

### `CONFLICT`

The request clashes with the current state, such as an illegal order transition (`completed` and `cancelled` are final) or capacity another booking already holds. Read the current state, then decide.

### `VALIDATION_FAILED`

The body isn't valid, and each field is listed under the message. Run `graft describe <command>` for a working example.

### `RATE_LIMITED`

Too many requests. Wait, then retry. In a loop, add a short `sleep` between calls.

## Using the commands

### `Unknown command`

`graft commands <word>` finds commands containing that word, and `graft <area> --help` lists an area's commands. If the endpoint is newer than your installed CLI, use [`graft api`](../using/#anything-the-commands-dont-cover-graft-api).

### `usage: graft … <arg> <arg>`

A command needs its ids as positional arguments, in order. `graft describe <command>` shows them.

### `--set expects key=value` / `--data must be JSON`

- `--set` needs an `=`. Quote values with spaces: `--set name="Ada King"`.
- `-d` takes inline JSON, `@file.json` (a file) or `-` (standard input), and the content must be valid JSON.

### A delete does nothing in a script

Without a terminal there's nobody to confirm, so the CLI refuses. Add `--yes`.

### A list stops at 25

That's one page. Add `--all`, or `-q limit=100` for a bigger page.

### Numbers or booleans arrive as text

Values that parse as JSON are sent as JSON. If you want the string `007` and not the number 7, write it as JSON: `--set code='"007"'`.

### Colours in logs

Set `NO_COLOR=1`.

## Still stuck?

Collect the **request id** from the error, the command you ran (without secrets), and `graft --version`, and send them to support.
