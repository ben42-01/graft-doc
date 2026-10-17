---
title: "Scripting and automation"
description: "Use the CLI in shell scripts, cron jobs and with AI assistants: JSON output, exit codes, safe read-only mode and unattended sign-in."
sidebar:
  order: 4
---

The CLI is built to be scripted. Data goes to **standard output**, messages go to **standard error**, and the [exit code](../using/#errors-and-exit-codes) tells you what happened.

## The scripting recipe

```bash
#!/usr/bin/env bash
set -euo pipefail          # stop at the first failure

graft whoami >/dev/null    # fail fast if not signed in (exit code 3)

graft orders list --all --json | jq -r '.[] | [.id, .status] | @tsv'
```

Four habits cover almost everything:

1. **`--json`** for anything a program reads. The output is exactly the API's `data`.
2. **`--all`** on lists, so you don't silently stop at page one.
3. **`--yes`** on deletes, which are refused without a terminal otherwise.
4. **Check the exit code**, not the text.

## `jq` recipes

```bash
# Ids of every order waiting for payment
graft orders list --all --json | jq -r '.[] | select(.status=="pending_payment") | .id'

# Count submissions this month
graft submissions list --all --json | jq '[.[] | select(.createdAt >= "2026-10-01")] | length'

# Records to CSV
graft entities records list "$ENTITY" --all --json \
  | jq -r '(["id","name","email"]), (.[] | [.id, .data.name, .data.email]) | @csv'

# How many customers
graft customers list --all --json | jq length
```

When you aren't sure what a response looks like, print one item and look:

```bash
graft orders list --json -q limit=1 | jq '.[0]'
```

## Bulk changes

Loop over ids and make the change, one request each. Keep an eye on the [rate limit](../../developers/conventions/): a `RATE_LIMITED` error means slow down.

```bash
# Mark every "new" record as "regular"
graft entities records list "$ENTITY" --all --json -q 'filter={"status":"new"}' \
  | jq -r '.[].id' \
  | while read -r id; do
      graft entities records update "$ENTITY" "$id" --set status=regular >/dev/null
    done
```

:::caution
Run a bulk change against a **list you printed and checked first**, not blind. Print the ids, read them, then run the loop. Some deletes can't be undone.
:::

## Handling failures

```bash
if ! out=$(graft orders transitions "$ORDER" -d '{"status":"confirmed"}' --json 2>err.txt); then
  case $? in
    1) echo "refused: $(cat err.txt)" ;;       # e.g. an illegal transition
    3) echo "not signed in" ;;
    4) echo "not allowed" ;;
    5) echo "no such order" ;;
    6) echo "server or network problem, retry later" ;;
  esac
fi
```

The error text includes the **request id**. Log it, so a failed run can be traced afterwards.

## Read-only mode

Setting `GRAFT_READONLY=1` makes the CLI refuse every request except `GET`, and also refuses `login` and `logout`. It is enforced by the CLI itself, not just a convention, so it is the right setting for reporting scripts and for anything that must only look.

```bash
export GRAFT_READONLY=1
graft orders list --json          # works
graft orders delete <orderId>     # refused, exit code 4
```

## Running unattended

Cron jobs and servers have no browser, and the CLI is designed around a person approving a code. There are two sound ways to run it unattended today.

**1. Sign in once on that machine.** Run `graft login --no-browser` there, open the link on your phone, approve the code. The session refreshes itself as long as it keeps being used, and the lock file keeps parallel runs from racing. Use a dedicated profile so it can't be mixed up with yours:

```bash
graft login --url https://your-graft-host --profile reports --no-browser
0 7 * * 1 GRAFT_READONLY=1 graft --profile reports reports summary get --json > /var/reports/weekly.json
```

Sign the person in as someone with the **least role that does the job**. A reporting job doesn't need to be the owner. Inviting a dedicated team member uses a seat; see [Team and seats](../../guide/team/).

**2. A short-lived token for a single script.** If you already hold an access token, `GRAFT_TOKEN` uses it as it is. It is never refreshed and stops working after about 15 minutes, so it suits a one-off, not a schedule.

:::note
`GRAFT_NO_BROWSER` and the `CI` and `SSH_CONNECTION` variables stop the CLI from trying to open a browser, but **a person must still approve the code**. A CI pipeline can't sign itself in. Personal API keys for CI and long-running automation are planned.
:::

Never copy `config.json` between machines. A refresh token used from two places looks like theft to the server, which then ends the session. Sign in on each machine separately.

## AI assistants

The Graft plugin for Claude uses the CLI as its hands. You ask in plain language ("which form brought in the most bookings this month?", "add Jane Murphy to Customers") and the assistant runs the CLI commands on your behalf.

- It acts as **you**, through your browser sign-in, with your role's permissions and nothing more.
- Bulky lookups (paging, counting, totalling) go to a read-only helper that runs with `GRAFT_READONLY=1`, which is enforced by the CLI.
- Deletes, cancellations, money and bulk changes are confirmed with you first and read back afterwards.

Set it up by signing in to the CLI, then in Claude Code:

```text
/plugin marketplace add ben42-01/graft
/plugin install graft@graft
```

Because commands come from the API itself, a new endpoint reaches the assistant without a plugin update.
