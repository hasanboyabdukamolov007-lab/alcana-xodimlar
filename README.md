# Alcana Xodimlar — Telegram Mini App

**Nomi:** Alcana-Xodimlar haqida maʼlumot  
**Vercel:** `https://alcana-xodimlar.vercel.app`

Repo ildizida Mini App joylashgan (`index.html`, `app.js`, `styles.css`). Telegram bot `bot/` papkasida.

## Vercel (tavsiya)

**Root Directory sozlash shart emas** — `index.html` repo ildizida.

### Variant A — GitHub ulash (eng yaxshi)

1. [vercel.com](https://vercel.com) → **Add New… → Project**
2. `hasanboyabdukamolov007-lab/alcana-xodimlar` reposini ulang
3. **Root Directory** ni boʻsh qoldiring (`.`)
4. Framework Preset: **Other**
5. **Deploy**

Mavjud `alcana-xodimlar` loyihasi boʻlsa: **Settings → Git** orqali shu repoga ulang, keyin **Deployments → Redeploy** (yoki main ga push).

### Variant B — Fayl yuklash

Faqat ildizdagi Mini App fayllarini yuklang:

- `index.html`
- `app.js`
- `styles.css`
- (ixtiyoriy) `vercel.json`

`bot/` papkasini Vercel ga yuklamang. Avvalgi notoʻgʻri upload (`staff-docs-ready/` yoki `miniapp/` ichida) 404 beradi — shu uchun ildizda `index.html` boʻlishi shart.

## Lokal tekshiruv

```bash
python3 -m http.server 8080
# brauzerda http://127.0.0.1:8080/ — index.html ochilishi kerak
```

## Botni ishga tushirish

```bash
cd bot
npm install
cp .env.example .env
```

`.env`:

```env
BOT_TOKEN=sizning_haqiqiy_bot_tokeningiz
WEBAPP_URL=https://alcana-xodimlar.vercel.app
```

```bash
npm start
```

## BotFather

1. [@BotFather](https://t.me/BotFather) → `/mybots`
2. Bot Settings → Menu Button → Configure menu button
3. URL: `https://alcana-xodimlar.vercel.app`

Telegramda `/start` → **Alcana Xodimlar** tugmasi.
