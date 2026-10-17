---
title: "Using the CLI"
description: "How commands are named, the flags that shape a request, how output and pagination work, and what the exit codes mean."
sidebar:
  order: 2
---

## How commands are named

Commands follow one rule: **`graft <area> [sub-area] <verb> [arguments]`**. They are derived from the API, so a new endpoint becomes a new command and the CLI can't drift from it.

| API call | Command |
|---|---|
| `GET /orders` | `graft orders list` |
| `POST /orders` | `graft orders create` |
| `GET /orders/:orderId` | `graft orders get <orderId>` |
| `PATCH /orders/:orderId` | `graft orders update <orderId>` |
| `DELETE /orders/:orderId` | `graft orders delete <orderId>` |
| `GET /entities/:entityId/records` | `graft entities records list <entityId>` |
| `POST /forms/:formId/publish` | `graft forms publish <formId>` |
| `PUT /orders/:orderId/payment-link` | `graft orders payment-link-set <orderId>` |
| `GET /reports/sales` | `graft reports sales get` |

- **Path parameters** become positional arguments, in order: `graft entities records get <entityId> <recordId>`.
- **Verbs** are `list`, `get`, `create`, `update`, `delete`, and for actions the action's own name (`publish`, `transitions`, `enable`).
- Platform-administration endpoints are never part of the CLI.

Every command is in the [command reference](../reference/), or ask the CLI:

```bash
graft help                       # the areas
graft orders --help              # every command under orders
graft commands                   # all of them, with the endpoint behind each
graft commands entities records # only those starting with these words
graft describe orders transitions
```

`describe` shows the endpoint, its arguments and real example requests taken from Graft's API test suite. In those examples, `{{…}}` marks a placeholder you fill in.

## Sending data

Commands that write take a JSON body. There are three ways to give it, and you can combine them.

### `--set key=value`

The easiest for small changes. Repeat it for more fields.

```bash
graft entities records create <entityId> \
  --set customer="Ada King" \
  --set starts_at=2026-10-12T10:00:00Z \
  --set status=new
```

- **Dotted keys nest:** `--set address.city=Cork` sends `{"address":{"city":"Cork"}}`.
- **Values that parse as JSON are JSON.** `--set quantity=3` sends the number 3, `--set vip=true` the boolean. To force a string, quote it as JSON: `--set code='"007"'`.

### `-d, --data`

A whole body, as inline JSON, a file, or standard input.

```bash
graft orders create -d '{"currency":"EUR","lineItems":[{"kind":"resource","description":"Pontoon, 4 hours","quantity":1,"unitAmountMinor":60000}]}'
graft orders create -d @order.json
cat order.json | graft orders create -d -
```

### Combining them

`--set` is applied on top of `-d`, which is handy for a template you tweak:

```bash
graft orders create -d @order.json --set notes="Birthday party"
```

### Query parameters: `-q, --query`

Filters, sorting and windows go in the query string. Repeat for more.

```bash
graft orders list -q status=confirmed -q from=2026-10-01T00:00:00Z
graft entities records list <entityId> -q 'filter={"status":"new"}' -q sort=createdAt
```

:::tip
Money is always **integer minor units**: `60000` with currency `EUR` is €600.00. Dates are ISO 8601 with a timezone.
:::

## Output

By default the CLI prints a readable table or a pretty-printed object, and short messages go to the error stream so they never get mixed into data.

```bash
graft orders list                 # a table
graft orders get <orderId>        # the object
graft orders list --json          # exactly the API's `data`, for jq and scripts
```

- Lists of plain objects become a table of the most useful columns (names, ids, status, dates first). Nested values show as `[3 items — use --json]`; use `--json` to see everything.
- A command with nothing to return (a delete, an unpublish) prints `done`.

`--json` is the one to use in scripts: the shape is the API's own, as shown in the [endpoint reference](../../developers/api/), with no formatting added.

### Pagination

List endpoints return one page (25 by default, up to 100 with `-q limit=100`). When there's more, the CLI says so on the error stream:

```text
more results — add --all to fetch every page
```

`--all` follows the cursor for you and returns every item as one list.

```bash
graft submissions list --all --json > submissions.json
graft entities records list <entityId> --all --json | jq length
```

`--all` only applies to `GET` list commands.

## Deleting

Every delete asks first:

```text
entities records delete <entityId> <recordId>? [y/N]
```

Pass `-y, --yes` to skip the question. **Without a terminal** (a script, a pipe, cron) there is nobody to ask, so a delete is refused unless you pass `--yes`.

## Anything the commands don't cover: `graft api`

`graft api` calls any endpoint directly, with the same sign-in, flags and output.

```bash
graft api GET /api/v1/reports/usage -q meter=records
graft api POST /api/v1/orders -d @order.json
graft api DELETE /api/v1/dashboards/<dashboardId> --yes
```

Use it for endpoints newer than your installed CLI. The path starts with `/api/v1/`.

## Flags at a glance

| Flag | |
|---|---|
| `-d, --data` | Request body: inline JSON, `@file.json`, or `-` for standard input |
| `--set key=value` | One body field. Repeatable. Dotted keys nest. JSON values parse. |
| `-q, --query key=value` | A query parameter. Repeatable. |
| `--all` | Follow pagination and return every item |
| `--json` | Print the API's `data` exactly, for `jq` and scripts |
| `-y, --yes` | Skip the confirmation every delete asks for. Required without a terminal. |
| `--profile NAME` | Which saved server and sign-in to use |
| `--url URL` | `login` only: the server to sign in to |
| `--no-browser` | `login` only: don't try to open a browser |
| `-h, --help` | Help for a command or area |
| `-v, --version` | The CLI version |

## Errors and exit codes

A refused request prints the API's error code and message, any per-field reasons, and the **request id**. Quote the request id to support; it finds the exact call.

```text
error VALIDATION_FAILED: The request body is invalid
  email: Enter a valid email address
request id: 7f3a… (quote this to support)
```

| Exit code | Meaning |
|---|---|
| `0` | Success |
| `1` | The request was refused (validation, conflict, quota, …) |
| `2` | Usage error: unknown command, missing argument, bad flag |
| `3` | Not signed in, or the session has ended |
| `4` | Forbidden: your role or plan doesn't allow it, or `GRAFT_READONLY` blocked it |
| `5` | Not found |
| `6` | Server or network error |

The error codes themselves (`VALIDATION_FAILED`, `QUOTA_EXCEEDED`, `CONFLICT`, …) are the API's. See [Conventions](../../developers/conventions/).
