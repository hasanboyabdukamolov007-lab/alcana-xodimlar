# Alcana Xodimlar — Telegram Mini App + Backend

**Nomi:** Alcana-Xodimlar haqida maʼlumot  
**Production Mini App:** `https://alcana-xodimlar.vercel.app`

Repo ildizida Mini App (`index.html`, `app.js`, `styles.css`) va Vercel serverless API (`api/`) joylashgan. Telegram bot `bot/` papkasida.

## Xususiyatlar

- Xodimlarni qoʻshish / tahrirlash (real DB)
- 14 ta majburiy hujjat checklist (belgilash + **koʻp fayl** yuklash, har biri bilan sana)
- Xodim fotosi: qurilma kamerasi/galereyadan yuklash
- **Telegramga saqlash** — faylni ochgan foydalanuvchi Telegram chatiga yuborish
- UZ / RU / EN
- Yozuv API: Telegram Mini App `initData` yoki `ADMIN_API_TOKEN`
- Bot: ochiq `/app` / `/help`; **admin** buyruqlar `ADMIN_TELEGRAM_IDS` bilan (`/admin`, `/list`, `/add`, …)
- Fayllar: Vercel Blob (ixtiyoriy) yoki DB ichida (kichik fayllar)

## Environment variables (Vercel)

Vercel → Project → **Settings → Environment Variables** (Production + Preview):

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | **Yes (prod)** | Turso libSQL URL, e.g. `libsql://…turso.io` |
| `TURSO_AUTH_TOKEN` | **Yes (prod)** | Turso auth token |
| `BOT_TOKEN` | Recommended | Same token as the Telegram bot — validates WebApp `initData` on writes **and** powers «Telegramga saqlash» (`sendDocument`) |
| `ADMIN_API_TOKEN` | Optional | Shared secret for scripts/admin (`X-Admin-Token` header) |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob token; if unset, files store as base64 in DB (~3.5MB limit) |

Do **not** invent or commit real secret values. Copy from Turso / BotFather / Vercel Blob UI.

Root `.env.example` lists the same keys for local use.

### Admin Telegram IDs (bot)

Admin-only bot buyruqlari (`/admin`, `/list`, `/add`, `/docs`, `/delete`, `/photo`, `/upload`) faqat `ADMIN_TELEGRAM_IDS` dagi userlarga.

1. Botda `/whoami` — o‘z Telegram **user ID** ni oling (raqam).
2. `bot/.env` ga qo‘ying (placeholders):
   ```env
   ADMIN_TELEGRAM_IDS=123456789,987654321
   ADMIN_API_TOKEN=same-as-vercel-admin-token
   ```
3. Botni restart qiling. Mini App **parolsiz** ochiladi (yozuvlar hali `BOT_TOKEN` initData / `ADMIN_API_TOKEN` bilan himoyalangan).
4. Adminlar: `/admin` menyu. Boshqalar: faqat `/app`, `/help`, `/whoami`.

`ADMIN_TELEGRAM_IDS` bo‘sh bo‘lsa — hech kim admin emas (xavfsiz default).

### Turso setup (free tier)

1. Create a DB at [turso.tech](https://turso.tech) (or `turso db create alcana-xodimlar`)
2. `turso db show alcana-xodimlar --url` → `TURSO_DATABASE_URL`
3. `turso db tokens create alcana-xodimlar` → `TURSO_AUTH_TOKEN`
4. Paste both into Vercel env vars
5. **Redeploy** the project (Deployments → … → Redeploy, or push to `main`)

Schema is created automatically on first API request (`/api/health` or `/api/employees`).  
Legacy single-file rows migrate into `document_files` automatically.

### Auth

- Mini App sends `X-Telegram-Init-Data: <tg.initData>` on write requests.
- If `BOT_TOKEN` is set, the API HMAC-validates initData.
- Alternatively send `X-Admin-Token: <ADMIN_API_TOKEN>` (or `Authorization: Bearer …`).
- If **neither** `BOT_TOKEN` nor `ADMIN_API_TOKEN` is set, writes are open (local/dev only — set at least one in production).
- «Telegramga saqlash» needs `BOT_TOKEN` **and** a real Mini App `initData` user (chat id).

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
API_BASE_URL=https://alcana-xodimlar.vercel.app
ADMIN_TELEGRAM_IDS=123456789,987654321
ADMIN_API_TOKEN=
```

```bash
npm start
```

Production da `WEBAPP_URL` / `API_BASE_URL` ni Vercel URL bilan bir xil qoldiring. `ADMIN_API_TOKEN` Vercel dagi bilan bir xil boʻlsin (bot yozuvlari uchun).

### Bot buyruqlari

| Command | Who | Description |
|---|---|---|
| `/start` | all | Salomlash + Mini App tugma |
| `/help` | all | Buyruqlar |
| `/app` | all | Mini App |
| `/whoami` | all | Telegram user ID (admin roʻyxatiga qoʻshish) |
| `/admin` | admin | Admin menyu |
| `/list` (`/staff`) | admin | Xodimlar + progress |
| `/docs <ism>` | admin | Hujjatlar holati |
| `/add <Ism Familiya>` | admin | Yangi xodim |
| `/delete <ism>` | admin | Xodim oʻchirish |
| `/photo` / `/upload` | admin | Foto/hujjat → Mini App |

## BotFather

1. [@BotFather](https://t.me/BotFather) → `/mybots`
2. Bot Settings → Menu Button → Configure menu button
3. URL: `https://alcana-xodimlar.vercel.app`

Telegramda `/start` → **Alcana Xodimlar** tugmasi.

## API qisqacha

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | no | Backend/DB status |
| GET | `/api/employees` | no | List employees + doc checklist (each slot has `files[]`) |
| POST | `/api/employees` | write | Create employee |
| GET | `/api/employees/:id` | no | One employee |
| PUT | `/api/employees/:id` | write | Update employee |
| DELETE | `/api/employees/:id` | write | Delete employee |
| POST/GET/DELETE | `/api/employees/:id/photo` | write (POST/DELETE) | Profile photo upload / serve / clear |
| PATCH | `/api/employees/:id/docs/:docId` | write | `{ "present": true/false }` — `present: true` requires ≥1 file; `false` clears all files in slot |
| POST | `/api/employees/:id/docs/:docId` | write | Append file `{ filename, mimeType, data(base64), date? }` |
| PATCH | `/api/employees/:id/docs/:docId/files/:fileId` | write | `{ "date": "YYYY-MM-DD" }` |
| DELETE | `/api/employees/:id/docs/:docId/files/:fileId` | write | Remove one file from the slot |
| GET | `/api/files/:employeeId/:docId` | no | Download latest file in slot |
| GET | `/api/files/:employeeId/:docId/:fileId` | no | Download specific file |
| POST | `/api/telegram/send-document` | write + Telegram user | `{ employeeId, docId, fileId }` → bot `sendDocument` to chatting user |

## Redeploy checklist (foydalanuvchi uchun)

1. Turso URL + token ni Vercel Environment Variables ga qoʻying
2. `BOT_TOKEN` (va ixtiyoriy `ADMIN_API_TOKEN`) ni qoʻying — «Telegramga saqlash» uchun `BOT_TOKEN` majburiy
3. Vercel da **Redeploy**
4. `/api/health` ni tekshiring
5. Bot `WEBAPP_URL` = `https://alcana-xodimlar.vercel.app`
6. Bot `.env`: `ADMIN_TELEGRAM_IDS` ( `/whoami` dan) + `ADMIN_API_TOKEN` → bot restart
7. Telegramda Mini App oching — status **Backend ulangan**; admin `/admin` ni sinab koʻring
