---
title: "API overview"
description: "What the Graft API is, who it is for and how it is laid out."
---

Everything you can do in the Graft app, you can do through its HTTP API. The app is a client of the same endpoints documented here.

## At a glance

| | |
|---|---|
| Base path | `/api/v1` on your Graft host |
| Format | JSON in, JSON out |
| Authentication | Bearer access token ([details](../authentication/)) |
| Scope | One token is one workspace |
| Pagination | Cursor based |
| Money | Integer minor units (cents) plus a currency code |
| Timestamps | UTC, ISO 8601 |

## Two surfaces

**Authenticated.** Almost everything: entities, records, forms, orders, inventory, team. You sign in, get an access token and send it with each request. What you can do depends on your role (owner, manager or member) and your plan.

**Public.** A small unauthenticated surface that a visitor's browser uses: submitting a published form and browsing its catalogue. See [Public forms](../public-forms/).

The platform-admin console and Stripe's webhook callbacks are internal and not documented here.

## Where to start

1. [Quickstart](../quickstart/): sign in and read your first record with `curl`.
2. [Authentication](../authentication/): tokens, refresh and switching workspace.
3. [Conventions](../conventions/): the response envelope, errors, pagination and rate limits.
4. [Endpoint reference](../api/): every endpoint, grouped by area.

## Plans and the API

Every plan can call the API. What differs is the request budget per workspace (see [Rate limits](../conventions/#rate-limits)) and which features sit behind a plan, such as batch import, invoicing and the full sales report. A call to a feature your plan lacks returns `403` naming the feature: `FEATURE_NOT_AVAILABLE` for batch import, `FORBIDDEN` for the Premium reports.
