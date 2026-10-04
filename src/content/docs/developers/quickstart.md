---
title: "Quickstart"
description: "Sign in and make your first calls with curl."
---

You need a Graft account with a verified email address. Replace `$GRAFT` with your host, for example `https://graft.app`.

## 1. Sign in

```bash
curl -s -X POST "$GRAFT/api/v1/auth/login" \
  -H 'content-type: application/json' \
  -d '{"email":"owner@example.com","password":"your-password"}'
```

```json
{
  "data": { "accessToken": "eyJhbGciOi…", "expiresAt": "2026-10-04T18:30:00.000Z" },
  "meta": { "requestId": "…" }
}
```

The token lasts 15 minutes. Keep it in a variable:

```bash
TOKEN="eyJhbGciOi…"
```

## 2. Check who you are

```bash
curl -s "$GRAFT/api/v1/me" -H "authorization: Bearer $TOKEN"
```

The response includes your workspace, your role and the features and limits of your plan.

## 3. Define an entity

```bash
curl -s -X POST "$GRAFT/api/v1/entities" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{
    "key": "customers",
    "name": "Customers",
    "fields": [
      {"key":"name","label":"Name","type":"text","required":true},
      {"key":"email","label":"Email","type":"email"}
    ]
  }'
```

Note the `id` in the response; it is the `entityId` below.

## 4. Add and read records

```bash
curl -s -X POST "$GRAFT/api/v1/entities/$ENTITY_ID/records" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Ada King","email":"ada@example.com"}'

curl -s "$GRAFT/api/v1/entities/$ENTITY_ID/records?limit=10" \
  -H "authorization: Bearer $TOKEN"
```

The record body is the fields directly. The response nests them under `data.data`.

## 5. Handle expiry

When the access token expires, calls return `401 UNAUTHORIZED`. Call `POST /api/v1/auth/refresh` with the refresh cookie to get a new one. See [Authentication](../authentication/).
