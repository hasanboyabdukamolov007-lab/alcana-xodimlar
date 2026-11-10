// Alcana Xodimlar Hujjatlari Telegram Bot
// Tokenni .env ga qo'ying

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://alcana-xodimlar.vercel.app';

if (!BOT_TOKEN) {
  console.error('Xato: .env faylida BOT_TOKEN ni qo\'ying!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(
    '👋 Alcana Xodimlar Hujjatlari tizimiga xush kelibsiz!\n\nHujjatlarni boshqarish uchun quyidagi tugmani bosing:',
    Markup.keyboard([
      [Markup.button.webApp('📄 Alcana Xodimlar', WEBAPP_URL)]
    ]).resize()
  );
});

bot.command('app', (ctx) => {
  ctx.reply(
    'Alcanа Xodimlar Mini App:',
    Markup.inlineKeyboard([
      Markup.button.webApp('📄 Xodimlar hujjatlari', WEBAPP_URL)
    ])
  );
});

bot.launch().then(() => {
  console.log('✅ Alcana Xodimlar bot ishga tushdi');
  console.log(`Mini App: ${WEBAPP_URL}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));