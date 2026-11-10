# Xodimlar Hujjatlari — Telegram Mini App (v2)

Professional versiya: O‘zbek (asosiy) + Русский + English.  
Backend: Vercel serverless API + Turso (SQLite) — qarang `README.md`.

## Hujjatlar ro‘yxati (rasmdan + testlar)

1. Xodimning shaxsiy ma'lumoti (`personal_info`)
2. Ishga olish ankеtasi (`application`)
3. Pasport nusxasi (`passport`)
4. 3x4 rasm (8 dona) (`photo_3x4`)
5. INN (`inn`)
6. Korxona ankеtasi (`company_form`)
7. Mehnat shartnomasi (`contract`)
8. Texnika xavfsizligi (`safety`)
9. Sudlanmaganligi haqida ma'lumotnoma (`no_criminal`)
10. **16Personalities test natijasi** (`personality`)
11. **Mensa IQ test natijasi** (`iq_test`)

## Xususiyatlar

- To‘liq 3 tilda ishlaydi (UZ / RU / EN)
- Qidiruv (search)
- Progress bar + Complete / Incomplete holati
- Har bir hujjat uchun tick + fayl yuklash (API orqali saqlanadi)
- Yangi xodim qo‘shish / tahrirlash (backend ulanganida)
- Telegram theme, haptic feedback, initData auth

## Qanday ishga tushirish

1. Lokal: `npm install && npm run dev` — `http://127.0.0.1:8080`
2. API yo‘q bo‘lsa brauzerda demo ma’lumot ko‘rinadi (“Demo rejim”)
3. Production: Vercel + `TURSO_*` env — UI “Backend ulangan” ko‘rsatadi
4. Telegram: BotFather Menu Button → `https://alcana-xodimlar.vercel.app`

To‘liq deploy / env yo‘riqnomasi: [README.md](./README.md).

---
Tayyorlangan: ALCANA PRINT uslubidagi hujjatlar nazorati uchun.
