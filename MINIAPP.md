# Xodimlar Hujjatlari — Telegram Mini App (v2)

Professional versiya: O‘zbek (asosiy) + Русский + English.  
Backend: Vercel serverless API + Turso (SQLite) — qarang `README.md`.

## Hujjatlar ro‘yxati

1. Xodimning shaxsiy ma'lumoti (`personal_info`)
2. Ishga olish ankеtasi (`application`)
3. Pasport nusxasi (`passport`)
4. 3x4 rasm (8 dona) (`photo_3x4`)
5. INN (`inn`)
6. Korxona ankеtasi (`company_form`)
7. Mehnat shartnomasi (`contract`)
8. Texnika xavfsizligi (`safety`)
9. **NPS** (`nps`)
10. **Hayot g‘ildiragi** (`life_wheel`)
11. **Valyutaga qarshi tilxat** (`currency_pledge`)
12. **Noqonuniy ma’lumotlardan foydalanmaslik tilxati** (`illegal_info_pledge`)
13. **16Personalities test natijasi** (`personality`)
14. **Mensa IQ test natijasi** (`iq_test`)

Olib tashlangan: Sudlanmaganligi haqida ma'lumotnoma (`no_criminal`).

## Xususiyatlar

- To‘liq 3 tilda ishlaydi (UZ / RU / EN)
- Qidiruv (search)
- Progress bar + Complete / Incomplete holati (faqat yuklangan fayllar hisoblanadi)
- Har bir hujjat slotida **bir nechta fayl** + sana; ro‘yxat UI
- **Telegramga saqlash** — faylni bot orqali foydalanuvchi chatiga yuboradi
- Faylsiz tick ogohlantirish beradi (UZ/RU/EN)
- Yuklash muvaffaqiyatli bo‘lgach hujjat avtomatik tasdiqlanadi
- Xodim fotosi: qurilmadan yuklash (URL emas); yo‘q bo‘lsa initials
- Yangi xodim qo‘shish / tahrirlash (backend ulanganida)
- Telegram theme, haptic feedback, initData auth
- Bot admin buyruqlari: `ADMIN_TELEGRAM_IDS` (qarang `README.md`)

## Qanday ishga tushirish

1. Lokal: `npm install && npm run dev` — `http://127.0.0.1:8080`
2. API yo‘q bo‘lsa brauzerda demo ma’lumot ko‘rinadi (“Demo rejim”)
3. Production: Vercel + `TURSO_*` env — UI “Backend ulangan” ko‘rsatadi
4. Telegram: BotFather Menu Button → `https://alcana-xodimlar.vercel.app`

To‘liq deploy / env yo‘riqnomasi: [README.md](./README.md).

---
Tayyorlangan: ALCANA PRINT uslubidagi hujjatlar nazorati uchun.
