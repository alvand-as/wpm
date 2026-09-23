# wpm — WhatsApp Project Management (MVP)

Minimal relay built on Meta's official **WhatsApp Cloud API**:

- `scripts/send.sh` — curl a text message to a hardcoded WhatsApp number.
- `api/webhook.js` — public endpoint Meta calls when that number replies; logs each message.

No database, no storage, no third-party services — just this one endpoint
and Vercel's own log stream.

### Why no groups

Meta's Cloud API only supports **one-to-one** conversations between a
business number and individual users — there is no official endpoint for
WhatsApp groups. This MVP sends/receives with a single hardcoded recipient
number instead of a group, per your decision to stick to the official API.

### Why logs instead of a custom curl stream

Vercel serverless functions run as isolated, ephemeral invocations with no
shared memory between them. A webhook POST and a separately-curled stream
endpoint would run in different instances, so a hand-rolled in-memory
relay would silently drop messages — not reliable for something you're
using to debug. Making the webhook reliable without storage means giving
up the custom `/api/stream` endpoint; instead, `api/webhook.js` just
`console.log`s each incoming message, and you tail it with Vercel's own
log stream, which Vercel guarantees captures every invocation regardless
of instance.

---

## Setup

### 1. Create the Meta app and WhatsApp product

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App** → type **Business**.
2. In the app dashboard, add the **WhatsApp** product.
3. Under **WhatsApp → API Setup** you'll see:
   - A **temporary access token** (valid 24h — fine for testing; see step 6 for a longer-lived one).
   - A **Phone Number ID** (a test number Meta gives you for free).
4. Under the same page, **Manage phone number list → Add recipient number** — add your own phone (the one you'll test with). Meta will text you a code to verify it. Until the WhatsApp Business Account is verified, you can only message numbers added here.

### 2. Set local env vars

```bash
cd /Users/meisam/Workspace/wpm
cp .env.example .env
```

Fill in `.env`:
- `WHATSAPP_TOKEN` — the temporary token from step 1.
- `WHATSAPP_PHONE_NUMBER_ID` — from step 1.
- `WHATSAPP_TO` — your verified test number, digits only (e.g. `15551234567`).
- `WHATSAPP_VERIFY_TOKEN` — make up any string; you'll reuse it in step 4.

### 3. Test sending (this part needs no deployment yet)

```bash
source .env  # or export the vars another way
./scripts/send.sh "Hello from wpm"
```

You should receive the message on your phone within seconds.

### 4. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel login
vercel                  # follow prompts, link/create the project
```

In the Vercel dashboard for this project, **Settings → Environment
Variables** → add `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
`WHATSAPP_VERIFY_TOKEN` (same values as your `.env`), then redeploy so
they take effect:

```bash
vercel --prod
```

Note your deployed URL, e.g. `https://wpm-yourname.vercel.app`.

### 5. Register the webhook with Meta

1. In the Meta app dashboard: **WhatsApp → Configuration**.
2. **Webhook → Edit**:
   - Callback URL: `https://<your-vercel-domain>/api/webhook`
   - Verify token: the same `WHATSAPP_VERIFY_TOKEN` value from your `.env`.
3. Click **Verify and Save** — Meta will GET your webhook URL and expect the challenge echoed back; `api/webhook.js` handles that.
4. Under **Webhook fields**, subscribe to **messages**.

### 6. (Optional) Get a longer-lived token

Temporary tokens expire in 24h. For anything beyond a quick test:
**App dashboard → WhatsApp → API Setup → System Users** (or **Business Settings → System Users**) → create a system user, generate a token scoped to `whatsapp_business_messaging` with no expiry. Swap it into `WHATSAPP_TOKEN` (both `.env` and Vercel's env vars, then redeploy).

---

## End-to-end test

Terminal 1 — tail the webhook's logs:

```bash
vercel logs <your-vercel-domain> --follow
```

(Or Vercel dashboard → your project → **Logs** tab, filtered to `/api/webhook`.)

Terminal 2 — send yourself a message:

```bash
export WHATSAPP_TOKEN=...
export WHATSAPP_PHONE_NUMBER_ID=...
export WHATSAPP_TO=...
./scripts/send.sh "ping"
```

On your phone, reply to that WhatsApp message. Within a couple seconds
the reply should show up as a JSON line in Terminal 1.

## Known limitations (MVP scope)

- One-to-one only, no groups (see above).
- No message history — logs are whatever Vercel retains, not queryable by this app.
- `WHATSAPP_TO` / recipient is hardcoded via env var, not dynamic.
- If you later want a real curl-able `/api/stream` endpoint again, that
  needs some external shared store (e.g. Upstash Redis) since Vercel
  functions can't share memory across invocations — this was removed
  intentionally to avoid that dependency.
