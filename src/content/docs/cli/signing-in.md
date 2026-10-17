---
title: "Signing in"
description: "Sign in with your browser, switch workspace, keep separate sign-ins for several servers and sign out."
sidebar:
  order: 1
---

The CLI signs in the way a smart TV does: it shows a short code, you approve it in a browser where you're already signed in to Graft, and the terminal is signed in a few seconds later. **The CLI never sees your password.**

## Sign in

```bash
graft login --url https://your-graft-host
```

You only need `--url` the first time. It's remembered per profile.

```text
  ! Your one-time code: WDJB-MJHT
  Open https://your-graft-host/device  (opened your browser)
  Waiting for approval…
  ✓ Signed in as ada@example.com · workspace Bella's Barbershop
```

1. The CLI opens `/device` on your Graft host, or shows the link if it can't open a browser.
2. In a browser where you're signed in, **type the code** shown in your terminal. It isn't pre-filled on purpose.
3. Check that the machine name matches the computer you're sitting at, then approve. If you have several workspaces you choose one here.
4. The terminal confirms. The code is single-use and expires after 10 minutes.

:::caution
Only approve a code that **you** just started in your own terminal. Never approve one someone sent you, however it's worded. That is how someone else would get a session on your account.
:::

### On a server or over ssh

When `SSH_CONNECTION` or `CI` is set, or `GRAFT_NO_BROWSER=1`, the CLI doesn't try to open a browser. It prints the link and the code. Open the link on any device, such as your phone, type the code, approve. You can also force this with `graft login --no-browser`.

## Who and where am I?

```bash
graft whoami
```

```text
user       ada@example.com (Ada King)
workspace  Bella's Barbershop · bellas-barbershop · premium · owner
server     https://your-graft-host
profile    default
```

Add `--json` for the same information as JSON.

## Switching workspace

One sign-in is always one workspace. If you belong to several, list them and switch:

```bash
graft workspace list
graft workspace use bellas-barbershop     # a slug, an id or the exact name
```

`workspace list` marks the current one with `▶`. Switching mints a new session for the other workspace and ends the old one, so the CLI never holds two.

## Several servers: profiles

Teams usually have a QA server and a production server. A **profile** is a saved server plus its sign-in. The default profile is called `default`.

```bash
graft login --url https://qa.your-graft-host --profile qa
graft whoami --profile qa
graft orders list --profile qa

export GRAFT_PROFILE=qa       # make qa the default for this shell
graft profiles                # every saved server, who is signed in, which workspace
```

Each profile has its own session, so signing out of one doesn't affect the other.

## Signing out

```bash
graft logout
```

This ends the session **on the server** as well as removing it from this machine, so a copied config file stops working immediately. Only the profile you name (or the default) is signed out.

## Where the session is kept

| Item | Detail |
|---|---|
| Location | `~/.config/graft/config.json`. Honours `$XDG_CONFIG_HOME`, and `$GRAFT_CONFIG_DIR` overrides both. |
| Permissions | The directory is mode `700` and the file `600`. |
| Holds | Each profile's server URL and its session (access and refresh tokens). |
| Lifetime | The access token lasts about 15 minutes and is refreshed automatically. The refresh token lasts 30 days and rotates every time it's used. |
| Concurrency | A lock file stops two `graft` processes rotating the token at once. The server treats a replayed refresh token as theft and ends the session, so this matters when you run several commands in parallel. |

If you are signed out unexpectedly, see [Troubleshooting](../troubleshooting/#signed-out-unexpectedly).

## Environment variables

| Variable | Effect |
|---|---|
| `GRAFT_URL` | Server URL. Overrides the profile's. |
| `GRAFT_PROFILE` | Default profile. `--profile` wins over it. |
| `GRAFT_TOKEN` | An access token to use as-is. It is never refreshed, so it stops working after about 15 minutes. For one-off scripts. |
| `GRAFT_READONLY` | `1` refuses every request except `GET` (and `login`/`logout`). See [Scripting](../scripting/#read-only-mode). |
| `GRAFT_NO_BROWSER` | Never try to open a browser during `login`. |
| `GRAFT_CONFIG_DIR` | Where the config directory lives. |
| `NO_COLOR` | Plain output with no colour. |

:::note
Personal API keys for CI and long-running automation are planned. Until then, automation signs in as a person; see [Scripting and automation](../scripting/#running-unattended).
:::
