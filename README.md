# Alcana Xodimlar — Telegram Mini App + Backend

**Nomi:** Alcana-Xodimlar haqida maʼlumot  
**Production Mini App:** `https://alcana-xodimlar.vercel.app`

Repo ildizida Mini App (`index.html`, `app.js`, `styles.css`) va Vercel serverless API (`api/`) joylashgan. Telegram bot `bot/` papkasida.

## Xususiyatlar

- Xodimlarni qoʻshish / tahrirlash (real DB)
- 11 ta majburiy hujjat checklist (belgilash + fayl yuklash)
- UZ / RU / EN
- Yozuv API: Telegram Mini App `initData` yoki `ADMIN_API_TOKEN`
- Fayllar: Vercel Blob (ixtiyoriy) yoki DB ichida (kichik fayllar)

## Environment variables (Vercel)

Vercel → Project → **Settings → Environment Variables** (Production + Preview):

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | **Yes (prod)** | Turso libSQL URL, e.g. `libsql://…turso.io` |
| `TURSO_AUTH_TOKEN` | **Yes (prod)** | Turso auth token |
| `BOT_TOKEN` | Recommended | Same token as the Telegram bot — validates WebApp `initData` on writes |
| `ADMIN_API_TOKEN` | Optional | Shared secret for scripts/admin (`X-Admin-Token` header) |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob token; if unset, files store as base64 in DB (~3.5MB limit) |

Do **not** invent or commit real secret values. Copy from Turso / BotFather / Vercel Blob UI.

Root `.env.example` lists the same keys for local use.

### Turso setup (free tier)

1. Create a DB at [turso.tech](https://turso.tech) (or `turso db create alcana-xodimlar`)
2. `turso db show alcana-xodimlar --url` → `TURSO_DATABASE_URL`
3. `turso db tokens create alcana-xodimlar` → `TURSO_AUTH_TOKEN`
4. Paste both into Vercel env vars
5. **Redeploy** the project (Deployments → … → Redeploy, or push to `main`)

Schema is created automatically on first API request (`/api/health` or `/api/employees`).

### Auth

- Mini App sends `X-Telegram-Init-Data: <tg.initData>` on write requests.
- If `BOT_TOKEN` is set, the API HMAC-validates initData.
- Alternatively send `X-Admin-Token: <ADMIN_API_TOKEN>` (or `Authorization: Bearer …`).
- If **neither** `BOT_TOKEN` nor `ADMIN_API_TOKEN` is set, writes are open (local/dev only — set at least one in production).

## Vercel deploy

**Root Directory** boʻsh qoldiring (`.`). Framework: **Other**.

### GitHub ulash

1. [vercel.com](https://vercel.com) → Project (`alcana-xodimlar`)
2. Set env vars above
3. Ensure Git repo is `hasanboyabdukamolov007-lab/alcana-xodimlar`
4. Deploy / Redeploy after env changes

After deploy, open:

- Mini App: `https://alcana-xodimlar.vercel.app`
- Health: `https://alcana-xodimlar.vercel.app/api/health` → `{ "ok": true, "backend": true, … }`

When health is OK, the UI shows **Backend ulangan** (not Demo) and **Yangi xodim qoʻshish** opens the real form.

`bot/` is excluded via `.vercelignore` (bot runs separately).

## Lokal ishga tushirish

```bash
npm install
npm run dev
# http://127.0.0.1:8080  — Mini App
# http://127.0.0.1:8080/api/health
```

Locally, without `TURSO_DATABASE_URL`, the API uses `data/alcana.db` (SQLite file).

API smoke test (server must be running):

```bash
npm run test:api
```

## Botni ishga tushirish

```bash
cd bot
npm install
cp .env.example .env
```

`bot/.env`:

```env
BOT_TOKEN=sizning_haqiqiy_bot_tokeningiz
WEBAPP_URL=https://alcana-xodimlar.vercel.app
```

```bash
npm start
```

Production da `WEBAPP_URL` ni Vercel URL bilan bir xil qoldiring.

## BotFather

1. [@BotFather](https://t.me/BotFather) → `/mybots`
2. Bot Settings → Menu Button → Configure menu button
3. URL: `https://alcana-xodimlar.vercel.app`

Telegramda `/start` → **Alcana Xodimlar** tugmasi.

## API qisqacha

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | no | Backend/DB status |
| GET | `/api/employees` | no | List employees + doc checklist |
| POST | `/api/employees` | write | Create employee |
| GET | `/api/employees/:id` | no | One employee |
| PUT | `/api/employees/:id` | write | Update employee |
| DELETE | `/api/employees/:id` | write | Delete employee |
| PATCH | `/api/employees/:id/docs/:docId` | write | `{ "present": true/false }` |
| POST | `/api/employees/:id/docs/:docId` | write | Upload `{ filename, mimeType, data(base64) }` |
| GET | `/api/files/:employeeId/:docId` | no | Download / redirect to blob |

## Redeploy checklist (foydalanuvchi uchun)

1. Turso URL + token ni Vercel Environment Variables ga qoʻying
2. `BOT_TOKEN` (va ixtiyoriy `ADMIN_API_TOKEN`) ni qoʻying
3. Vercel da **Redeploy**
4. `/api/health` ni tekshiring
5. Bot `WEBAPP_URL` = `https://alcana-xodimlar.vercel.app`
6. Telegramda Mini App oching — status **Backend ulangan**, MainButton forma ochadi
