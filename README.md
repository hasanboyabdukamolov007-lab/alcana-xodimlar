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
- **Rahbar paroli** (`LEADER_PASSWORD`) — Mini App + API + bot faqat paroldan keyin
- Bot buyruqlari: `/list`, `/add`, `/docs`, `/app`, …
- Fayllar: Vercel Blob (ixtiyoriy) yoki DB ichida (kichik fayllar)

## Environment variables (Vercel)

Vercel → Project → **Settings → Environment Variables** (Production + Preview):

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | **Yes (prod)** | Turso libSQL URL, e.g. `libsql://…turso.io` |
| `TURSO_AUTH_TOKEN` | **Yes (prod)** | Turso auth token |
| `BOT_TOKEN` | Recommended | Same token as the Telegram bot — validates WebApp `initData` on writes **and** powers «Telegramga saqlash» (`sendDocument`) |
| `LEADER_PASSWORD` | Recommended (prod) | Leader gate password (alias: `ACCESS_PASSWORD`). When set, Mini App / API / bot stay locked until this password is entered |
| `ADMIN_API_TOKEN` | Optional | Shared secret for scripts/admin (`X-Admin-Token` header) |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob token; if unset, files store as base64 in DB (~3.5MB limit) |

Do **not** invent or commit real secret values. Copy from Turso / BotFather / Vercel Blob UI.

Root `.env.example` lists the same keys for local use.

### Leader link + password (Hasanboy uchun)

1. Vercel (va bot `bot/.env`) da `LEADER_PASSWORD=...` qoʻying (yoki `ACCESS_PASSWORD`). Haqiqiy sirni chatga yozmang / repoga commit qilmang.
2. **Redeploy** Vercel; botni restart qiling (`LEADER_PASSWORD` bot `.env` da ham bir xil boʻlsin).
3. Rahbarlarga **ikkita narsa** bering:
   - **Link (Mini App):** `https://alcana-xodimlar.vercel.app` (BotFather menu button / bot `/app` ham shu)
   - **Parol:** Vercel dagi `LEADER_PASSWORD` qiymati (ogʻzaki / xavfsiz kanal)
4. Mini App ochilganda parol soʻraladi → toʻgʻri kiritsa session ichida saqlanadi.
5. Botda: `/login <parol>` → keyin `/list`, `/add`, `/docs`, …
6. Parolni almashtirish: Vercel env ni oʻzgartiring → Redeploy; bot `.env` ni yangilang → restart. Eski sessionlar ishlamay qoladi.

Ixtiyoriy qisqa link: `https://alcana-xodimlar.vercel.app?access=PAROL` (parol URL da qolmasin — ilova uni olib tashlaydi; oddiy holatda alohida ulashing).

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
- If `LEADER_PASSWORD` / `ACCESS_PASSWORD` is set, **all** staff/file APIs also require `X-Leader-Password` (or `?access=` for file open links).
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
LEADER_PASSWORD=change-me-leader-password
ADMIN_API_TOKEN=
```

```bash
npm start
```

Production da `WEBAPP_URL` / `API_BASE_URL` ni Vercel URL bilan bir xil qoldiring. `LEADER_PASSWORD` Vercel dagi bilan bir xil boʻlsin.

### Bot buyruqlari

| Command | Description |
|---|---|
| `/start` | Salomlash + Mini App tugma |
| `/help` | Buyruqlar roʻyxati |
| `/login <parol>` | Rahbar kirishi (`LEADER_PASSWORD`) |
| `/logout` | Chiqish |
| `/app` | Mini App |
| `/list` (`/staff`) | Xodimlar + progress |
| `/docs <ism>` | Xodim hujjatlari holati |
| `/add <Ism Familiya>` | Yangi xodim |
| `/photo` / `/upload` | Foto/hujjat yuklash → Mini App ga yoʻnaltiradi |

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

When `LEADER_PASSWORD` is set, staff/file/telegram routes also need `X-Leader-Password` (health stays public and returns `accessRequired: true`).

## Redeploy checklist (foydalanuvchi uchun)

1. Turso URL + token ni Vercel Environment Variables ga qoʻying
2. `BOT_TOKEN` (va ixtiyoriy `ADMIN_API_TOKEN`) ni qoʻying — «Telegramga saqlash» uchun `BOT_TOKEN` majburiy
3. `LEADER_PASSWORD` qoʻying; xuddi shuni bot `.env` ga ham yozing
4. Vercel da **Redeploy**; botni restart qiling
5. `/api/health` ni tekshiring (`accessRequired: true` boʻlishi kerak)
6. Bot `WEBAPP_URL` = `https://alcana-xodimlar.vercel.app`
7. Rahbarga **link + parol** bering; Mini App / `/login` ni sinab koʻring
