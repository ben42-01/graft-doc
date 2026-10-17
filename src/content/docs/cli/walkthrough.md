---
title: "Walkthrough: run a workspace"
description: "A complete tour of managing a Graft workspace from the terminal, from first sign-in to reports, with real commands for each step."
sidebar:
  order: 3
---

This page takes a small business from an empty workspace to taking orders, using only the CLI. Each part stands alone, so jump to the one you need. If a command here is new to you, `graft describe <command>` shows its arguments and examples.

Throughout, `<entityId>`, `<orderId>` and similar are ids you get from the matching `list` or `create` command. A handy habit is to keep them in shell variables with `jq`:

```bash
ENTITY=$(graft entities create -d @customers.json --json | jq -r .id)
```

New to the concepts? Read [Core concepts](../../getting-started/concepts/) first.

## 1. Sign in and look around

```bash
graft login --url https://your-graft-host
graft whoami
graft workspace list
```

Then check what your plan allows. `me get` returns your identity and the workspace's resolved features and limits:

```bash
graft me get
graft me get --json | jq '.tenant.features'
```

:::tip
Gate scripts on `tenant.features`, never on the plan name. A feature can be granted or removed independently of the tier.
:::

## 2. Start from a template

A [workspace template](../../guide/templates/) builds the entities, sample records, bookable pools and forms for a type of business.

```bash
graft workspace-templates list
graft workspace-templates get <templateId>     # the full blueprint and what you can answer
```

Preview first. It writes nothing and tells you what would be created and what it costs against your plan:

```bash
graft workspace-templates preview <templateId> -d '{
  "answers": {
    "nouns": { "room": { "singular": "Cabin", "plural": "Cabins" } },
    "modules": ["housekeeping"],
    "depositPercent": 20
  }
}'
```

When it looks right, apply with the same answers. Only an owner or manager can apply, because a template creates forms.

```bash
graft workspace-templates apply <templateId> -d '{"answers": {"depositPercent": 20}}'
```

Applying again with the id of a finished run changes nothing, so it's safe to retry after a network error: pass the run id as `-d '{"runId":"<id>"}'`.

## 3. Shape your data: entities

An [entity](../../guide/entities/) is your own kind of thing: customers, bookings, boats. Field types are `text`, `number`, `date`, `select`, `checkbox`, `email`, `phone` and `image`.

```bash
graft entities list
graft entities get <entityId>

graft entities create -d '{
  "key": "customers",
  "name": "Customers",
  "fields": [
    {"key":"name","label":"Name","type":"text","required":true},
    {"key":"email","label":"Email","type":"email"},
    {"key":"status","label":"Status","type":"select","options":["new","regular","vip"]}
  ]
}'
```

Rename an entity or change its fields:

```bash
graft entities update <entityId> --set name="Clients"
```

A field's `key` is permanent once saved; its label is free to change. Changing the *structure* of the fields bumps the entity's schema version; relabelling doesn't. Deleting an entity asks for confirmation:

```bash
graft entities delete <entityId>
```

## 4. Work with records

[Records](../../guide/records/) are the rows of an entity. The body is the record's fields directly.

```bash
graft entities records create <entityId> --set name="Ada King" --set email=ada@example.com
graft entities records list <entityId>
graft entities records get <entityId> <recordId>
graft entities records update <entityId> <recordId> --set status=vip
graft entities records delete <entityId> <recordId>        # a soft delete
```

### Find the ones you want

`filter` is a JSON object of field key to exact value. An unknown key is an error, so typos don't silently match nothing.

```bash
graft entities records list <entityId> -q 'filter={"status":"vip"}'
graft entities records list <entityId> -q sort=updatedAt -q limit=100
```

### Read everything

```bash
graft entities records list <entityId> --all --json > customers.json
graft entities records list <entityId> --all --json | jq -r '.[] | [.id, .data.name, .data.email] | @csv'
```

Records come back with your fields nested under `data`.

### Attach an image to a record

Uploads are a three-step flow, because the bytes go straight to storage and not through Graft. JPEG, PNG and WebP only.

```bash
# 1. ask for an upload slot (valid for 5 minutes)
graft entities records media create <entityId> <recordId> \
  -d '{"fieldKey":"photo","contentType":"image/png","sizeBytes":48211}' --json
# 2. PUT the file to the url in the response
curl -X PUT -H 'content-type: image/png' --data-binary @photo.png "<uploadUrl>"
# 3. confirm it landed
graft entities records media confirm <entityId> <recordId> <mediaId>
```

## 5. Import in bulk

Importing a CSV or JSON file needs the `csv_import` feature (Premium and above). It is also three steps, then a run:

```bash
# 1. get an upload slot (up to 25 MB)
graft entities import-uploads create <entityId> -d '{"contentType":"text/csv","sizeBytes":20480}' --json
# 2. upload the file
curl -X PUT -H 'content-type: text/csv' --data-binary @customers.csv "<uploadUrl>"
# 3. confirm
graft entities import-uploads confirm <entityId> <mediaId>
```

Always **dry-run** first. `mapping` maps your source columns to field keys; a column mapped to `null` is skipped. `dedupeKey` matches existing records instead of creating duplicates.

```bash
graft entities imports create <entityId> -d '{
  "mediaId": "<mediaId>",
  "format": "csv",
  "mapping": { "Full name": "name", "E-mail": "email", "Notes": null },
  "dedupeKey": "email",
  "dryRun": true
}'
```

Run it for real by sending the same body with `"dryRun": false`, then re-read the result any time:

```bash
graft entities imports get <entityId> <importId>
```

Premium imports are capped at 10,000 rows each; more is `ROW_LIMIT_EXCEEDED`. Split the file.

## 6. Forms and submissions

A [form](../../guide/forms/) is a named, ordered subset of an entity's fields. Public forms are what visitors fill in.

```bash
graft forms create -d '{
  "entityId": "<entityId>",
  "name": "Book a boat",
  "slug": "book-a-boat",
  "visibility": "public",
  "fields": [{"key":"name"},{"key":"email"}]
}'
graft forms list
graft forms get <formId>
graft forms update <formId> --set name="Book a boat today"
```

Publish it at `/f/<workspace-slug>/<form-slug>`, or take it offline:

```bash
graft forms publish <formId>
graft forms unpublish <formId>
```

Publishing reserves part of your active-form limit, and unpublishing takes the form's images offline with it. Only an owner or admin can change forms. For the kill switch, `graft forms update <formId> --set enabled=false` outranks `published`.

### Carousel images

The same two-call upload pattern as records:

```bash
graft forms media create <formId> -d '{"contentType":"image/jpeg","sizeBytes":90211}' --json
curl -X PUT -H 'content-type: image/jpeg' --data-binary @hero.jpg "<uploadUrl>"
graft forms media confirm <formId> <mediaId>
graft forms carousel-set <formId> -d '{"images":[{"mediaId":"<mediaId>","alt":"Our boats"}]}'
```

### The inbox

Everything visitors sent, newest first, with the form, the sender and the order it raised:

```bash
graft submissions list
graft submissions list --all --json | jq '[.[] | select(.createdAt > "2026-10-01")] | length'
```

For how visitors submit, see [Public forms](../../developers/public-forms/).

## 7. Orders

[Orders](../../guide/orders/) carry their money as integer minor units. Line items have a `kind`: `resource`, `addon`, `fee` or `discount`. The server computes every total, and a discount line is negative.

```bash
graft orders create -d '{
  "currency": "EUR",
  "customerRecordId": "<recordId>",
  "lineItems": [
    {"kind":"resource","description":"24ft pontoon, 4 hours","quantity":1,"unitAmountMinor":60000},
    {"kind":"addon","description":"Life jackets","quantity":4,"unitAmountMinor":500}
  ],
  "deposit": null
}'
```

Find and read orders:

```bash
graft orders list -q status=pending_payment
graft orders list -q customerRecordId=<recordId> -q from=2026-10-01T00:00:00Z
graft orders get <orderId>
```

### Move an order through its life

```bash
graft orders transitions <orderId> -d '{"status":"confirmed"}'
```

| From | To |
|---|---|
| `draft` | `pending_payment`, `confirmed`, `cancelled` |
| `pending_payment` | `confirmed`, `cancelled` |
| `confirmed` | `in_progress`, `completed`, `cancelled` |
| `in_progress` | `completed`, `cancelled` |

`completed` and `cancelled` are final. Anything else is a `CONFLICT` (exit code 1). Edit an order only while it's still active:

```bash
graft orders update <orderId> --set notes="Birthday party"
graft orders delete <orderId>
```

### Getting paid

Three ways, and you can mix them. See [Payments](../../guide/payments/).

```bash
# Record money received by hand
graft orders payments <orderId> -d '{"amountMinor":15000,"reference":"Bank transfer 4421"}'

# Attach a Stripe Payment Link (buy.stripe.com) or hosted invoice (invoice.stripe.com)
graft orders payment-link-set <orderId> -d '{"url":"https://buy.stripe.com/test_abc123"}'
graft orders payment-link send <orderId>          # email it to the customer
graft orders payment-link-delete <orderId>

# See what is still outstanding
graft orders ledger get <orderId>
```

For card payments through Stripe Connect:

```bash
graft payments stripe-connect get
graft payments stripe-connect onboarding        # returns a Stripe-hosted link; owner or admin
graft payments stripe-connect delete            # disconnect
```

## 8. Customers and invoices

Customers are derived from orders, so there is nothing to create:

```bash
graft customers list
graft customers get <customerId>                # contact details, spend, what they owe, every order
```

Invoices are issued against an order. `kind` is `full`, `deposit` or `balance`:

```bash
graft invoices create -d '{"orderId":"<orderId>","kind":"deposit","dueInDays":14}'
graft invoices list -q orderId=<orderId> -q status=open
graft invoices update <invoiceId> --set status=paid     # or void
```

## 9. Bookable inventory

[Pools](../../guide/bookings/) make a record bookable. The strategy is `individual_asset` (one unique unit), `pooled_quantity` (stock of N) or `time_slot` (concurrent capacity).

```bash
graft inventory pools create -d '{
  "entityId": "<entityId>",
  "recordId": "<recordId>",
  "strategy": "pooled_quantity",
  "totalQuantity": 50,
  "bufferMinutes": 30
}'
graft inventory pools list -q entityId=<entityId>
graft inventory pools update <poolId> --set totalQuantity=60
```

Check what's free, then hold it so two customers can't take the same slot:

```bash
graft inventory pools availability get <poolId> \
  -q startAt=2026-10-12T10:00:00.000Z -q endAt=2026-10-12T14:00:00.000Z -q quantity=1

graft inventory pools holds <poolId> \
  -d '{"startAt":"2026-10-12T10:00:00.000Z","endAt":"2026-10-12T14:00:00.000Z","quantity":1}'
```

A hold that would overbook is refused as a `CONFLICT`. Then manage the master schedule:

```bash
graft inventory allocations list
graft inventory allocations update <allocationId> --set status=confirmed   # or released, cancelled
graft inventory allocations delete <allocationId>
```

## 10. Reports and usage

```bash
graft reports summary get                       # open orders, what's owed, last 30 days vs the 30 before
graft reports sales get -q from=2026-10-01T00:00:00Z -q to=2026-10-31T23:59:59Z
graft reports usage get -q meter=records
```

The full sales report and the usage chart need the Premium `reports` feature; without it the command is refused (exit code 4) and names the feature. A backwards window (`from` after `to`) is refused too.

Check how close you are to a plan limit with a meter: one of `form_submissions`, `active_forms`, `internal_forms`, `records`, `entities`, `dashboards`, `plugins`, `seats` or `storage_mb`.

```bash
graft meters get records
graft meters get seats
```

## 11. Dashboards

Widget `type` is `record_list`, `kpi`, `calendar` or `chart`, placed on a grid with `x`, `y`, `w` and `h`.

```bash
graft dashboards create -d '{
  "name": "Overview",
  "widgets": [{"id":"w1","type":"kpi","config":{},"layout":{"x":0,"y":0,"w":3,"h":1}}]
}'
graft dashboards list
graft dashboards update <dashboardId> --set name="Operations"
graft dashboards delete <dashboardId>
```

Updating replaces the widget list (up to 40), so read the dashboard first and send the full list back.

## 12. Plugins

```bash
graft plugins list                  # the catalogue, with what's enabled
graft plugins enable <pluginId>
graft plugins disable <pluginId>
```

Plugins that provision forms need an owner or admin. A plan limit returns `QUOTA_EXCEEDED`. See [Plugins](../../guide/plugins/).

## 13. Team and seats

Owner only. Members plus pending invites must stay within your plan's seats.

```bash
graft team get                                   # members, pending invites, seats used and limit
graft team invites create -d '{"role":"member","email":"sam@example.com"}' --json
```

The invite's link is in `url` and **appears only once**; it's never stored, so copy it now. Invites expire after 7 days.

```bash
graft team invites delete <inviteId>             # revoke a pending invite
graft team members delete <userId>               # remove someone; the owner can't remove themselves
graft team invites accept -d '{"token":"<token>"}'   # as the invited person, signed in
```

See [Team and seats](../../guide/team/).

## 14. Plan and billing

```bash
graft billing checkout -d '{"plan":"monthly"}'   # owner only; prints the Stripe Checkout URL
```

Open the URL in a browser to complete the upgrade. See [Plans and limits](../../guide/plans/).

## 15. Guided setup and onboarding

The first-run wizard and the guided setup are also available, which is mostly useful for scripted demo or training workspaces:

```bash
graft setup create                               # start a guided setup run
graft setup get
graft setup update --set step=records --set recordCount=2
graft onboarding get
```

## A complete example: open for business

Putting it together, a script that sets up a booking form, publishes it and checks the result:

```bash
#!/usr/bin/env bash
set -euo pipefail

ENTITY=$(graft entities create --json -d '{
  "key":"boats","name":"Boats",
  "fields":[{"key":"name","label":"Name","type":"text","required":true}]
}' | jq -r .id)

graft entities records create "$ENTITY" --set name="Pontoon 1" >/dev/null

FORM=$(graft forms create --json -d "{
  \"entityId\":\"$ENTITY\",\"name\":\"Book a boat\",\"slug\":\"book-a-boat\",
  \"visibility\":\"public\",\"fields\":[{\"key\":\"name\"}]
}" | jq -r .id)

graft forms publish "$FORM"
graft meters get active_forms
```

For running scripts like this safely and unattended, see [Scripting and automation](../scripting/).
