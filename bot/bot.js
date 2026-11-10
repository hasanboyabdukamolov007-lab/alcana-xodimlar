// Alcana Xodimlar Hujjatlari Telegram Bot
// Commands mirror Mini App actions; leader password gates access when configured.

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://alcana-xodimlar.vercel.app';
const API_BASE = (process.env.API_BASE_URL || WEBAPP_URL).replace(/\/$/, '');
const LEADER_PASSWORD = String(
  process.env.LEADER_PASSWORD || process.env.ACCESS_PASSWORD || ''
).trim();
const ADMIN_API_TOKEN = String(process.env.ADMIN_API_TOKEN || '').trim();

if (!BOT_TOKEN) {
  console.error("Xato: .env faylida BOT_TOKEN ni qo'ying!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

/** @type {Set<string>} */
const unlockedChats = new Set();
/** @type {Map<string, { step: string, draft?: object }>} */
const conversations = new Map();

function chatKey(ctx) {
  return String(ctx.chat?.id || ctx.from?.id || '');
}

function accessEnabled() {
  return Boolean(LEADER_PASSWORD);
}

function isUnlocked(ctx) {
  if (!accessEnabled()) return true;
  return unlockedChats.has(chatKey(ctx));
}

function lockMessage() {
  return (
    "🔒 Rahbar paroli talab qilinadi.\n\n" +
    "Kirish: `/login SIZNING_PAROLINGIZ`\n" +
    "Yoki Mini App: ochib parolni kiriting.\n\n" +
    "Parolni Hasanboy Vercel / bot `.env` dagi `LEADER_PASSWORD` orqali beradi."
  );
}

async function requireUnlock(ctx, next) {
  if (isUnlocked(ctx)) return next();
  await ctx.reply(lockMessage(), { parse_mode: 'Markdown' });
}

async function api(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (LEADER_PASSWORD) headers['X-Leader-Password'] = LEADER_PASSWORD;
  if (ADMIN_API_TOKEN) headers['X-Admin-Token'] = ADMIN_API_TOKEN;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function progressLine(emp) {
  const docs = emp.documents || {};
  const ids = Object.keys(docs);
  const total = ids.length || 1;
  const done = ids.filter((id) => docs[id]?.present || docs[id]?.hasFile || (docs[id]?.files || []).length).length;
  return `${done}/${total}`;
}

function helpText() {
  return [
    '📋 *Alcana Xodimlar* — bot buyruqlari',
    '',
    accessEnabled() ? '🔐 `/login <parol>` — kirish' : '🔐 Parol o‘chiq (dev)',
    '🚪 `/logout` — chiqish',
    '📄 `/app` — Mini App ochish',
    '👥 `/list` yoki `/staff` — xodimlar ro‘yxati',
    '🔎 `/docs <ism>` — xodim hujjatlari',
    '➕ `/add <Ism Familiya>` — xodim qo‘shish',
    '📷 `/photo` — foto yuklash (Mini App orqali)',
    '📎 `/upload` — hujjat yuklash (Mini App orqali)',
    '❓ `/help` — shu yordam',
    '',
    `Mini App: ${WEBAPP_URL}`,
  ].join('\n');
}

function webAppKeyboard() {
  return Markup.keyboard([[Markup.button.webApp('📄 Alcana Xodimlar', WEBAPP_URL)]]).resize();
}

bot.start(async (ctx) => {
  const unlocked = isUnlocked(ctx);
  await ctx.reply(
    unlocked
      ? "👋 Alcana Xodimlar Hujjatlari.\n\nBuyruqlar: /help\nMini App tugmasi pastda."
      : "👋 Alcana Xodimlar Hujjatlari.\n\n" + lockMessage(),
    {
      parse_mode: unlocked ? undefined : 'Markdown',
      ...webAppKeyboard(),
    }
  );
});

bot.command('help', (ctx) => ctx.reply(helpText(), { parse_mode: 'Markdown' }));

bot.command(['login', 'auth', 'password'], async (ctx) => {
  if (!accessEnabled()) {
    unlockedChats.add(chatKey(ctx));
    return ctx.reply('Parol sozlanmagan — kirish ochiq (dev). /help');
  }
  const text = ctx.message?.text || '';
  const parts = text.trim().split(/\s+/);
  const pwd = parts.slice(1).join(' ').trim();
  if (!pwd) {
    return ctx.reply('Ishlatish: `/login SIZNING_PAROLINGIZ`', { parse_mode: 'Markdown' });
  }
  if (pwd !== LEADER_PASSWORD) {
    unlockedChats.delete(chatKey(ctx));
    return ctx.reply('❌ Parol noto‘g‘ri.');
  }
  unlockedChats.add(chatKey(ctx));
  return ctx.reply('✅ Kirish muvaffaqiyatli. Endi /list, /add, /docs ishlaydi.\n/help');
});

bot.command('logout', async (ctx) => {
  unlockedChats.delete(chatKey(ctx));
  conversations.delete(chatKey(ctx));
  await ctx.reply(accessEnabled() ? '🚪 Chiqdingiz. Qayta `/login` qiling.' : 'Chiqildi.', {
    parse_mode: 'Markdown',
  });
});

bot.command('app', requireUnlock, async (ctx) => {
  await ctx.reply('Alcana Xodimlar Mini App:', Markup.inlineKeyboard([
    Markup.button.webApp('📄 Xodimlar hujjatlari', WEBAPP_URL),
  ]));
});

bot.command(['list', 'staff'], requireUnlock, async (ctx) => {
  try {
    const data = await api('GET', '/api/employees');
    const employees = data.employees || [];
    if (!employees.length) {
      return ctx.reply('Xodimlar yo‘q. Qo‘shish: `/add Ism Familiya`', { parse_mode: 'Markdown' });
    }
    const lines = employees.slice(0, 40).map((e, i) => {
      const pos = e.position?.uz || e.position?.ru || e.position?.en || '';
      return `${i + 1}. *${escapeMd(e.name)}* — ${progressLine(e)} ${pos ? `(${escapeMd(pos)})` : ''}`;
    });
    if (employees.length > 40) lines.push(`… +${employees.length - 40} ta`);
    await ctx.reply(`👥 Xodimlar (${employees.length}):\n\n${lines.join('\n')}`, {
      parse_mode: 'Markdown',
    });
  } catch (err) {
    await ctx.reply(`Xato: ${err.message}`);
  }
});

bot.command(['docs', 'employee', 'get'], requireUnlock, async (ctx) => {
  const query = (ctx.message?.text || '').replace(/^\/\S+\s*/, '').trim();
  if (!query) {
    return ctx.reply('Ishlatish: `/docs Karimov`', { parse_mode: 'Markdown' });
  }
  try {
    const data = await api('GET', '/api/employees');
    const q = query.toLowerCase();
    const matches = (data.employees || []).filter((e) => String(e.name).toLowerCase().includes(q));
    if (!matches.length) return ctx.reply('Topilmadi.');
    const emp = matches[0];
    const docs = emp.documents || {};
    const lines = Object.keys(docs).map((id) => {
      const d = docs[id] || {};
      const files = Array.isArray(d.files) ? d.files : [];
      const ok = d.present || d.hasFile || files.length > 0;
      const fileHint = files.length
        ? files.map((f) => `${f.filename || 'file'} (${f.date || '—'})`).join(', ')
        : d.filename || 'fayl yo‘q';
      return `${ok ? '✅' : '⬜'} \`${id}\` — ${fileHint}`;
    });
    await ctx.reply(
      `📄 *${escapeMd(emp.name)}* (${progressLine(emp)})\n\n${lines.join('\n')}\n\nYuklash: Mini App → /app`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    await ctx.reply(`Xato: ${err.message}`);
  }
});

bot.command('add', requireUnlock, async (ctx) => {
  const name = (ctx.message?.text || '').replace(/^\/add\s*/i, '').trim();
  if (!name) {
    conversations.set(chatKey(ctx), { step: 'await_name' });
    return ctx.reply('Yangi xodim ismini yuboring (yoki `/add Ism Familiya`):');
  }
  try {
    const data = await api('POST', '/api/employees', {
      name,
      position: {},
    });
    await ctx.reply(
      `✅ Qo‘shildi: *${escapeMd(data.employee?.name || name)}*\nHujjat/foto yuklash: /app`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    await ctx.reply(`Qo‘shib bo‘lmadi: ${err.message}`);
  }
});

bot.command(['photo', 'upload'], requireUnlock, async (ctx) => {
  await ctx.reply(
    '📷/📎 Foto va hujjat yuklash Mini App orqali amalga oshiriladi (Telegram WebView + fayl picker).\n\n' +
      '1) /app tugmasini bosing\n' +
      '2) Xodimni oching → Yuklash / Rasm tanlash\n' +
      '3) Kerak bo‘lsa «Telegramga saqlash»',
    Markup.inlineKeyboard([Markup.button.webApp('📄 Mini App', WEBAPP_URL)])
  );
});

bot.on('text', requireUnlock, async (ctx, next) => {
  const key = chatKey(ctx);
  const state = conversations.get(key);
  if (!state) return next();
  if (state.step === 'await_name') {
    const name = String(ctx.message.text || '').trim();
    conversations.delete(key);
    if (!name || name.startsWith('/')) {
      return ctx.reply('Bekor. Qayta: `/add Ism Familiya`', { parse_mode: 'Markdown' });
    }
    try {
      const data = await api('POST', '/api/employees', { name, position: {} });
      return ctx.reply(
        `✅ Qo‘shildi: *${escapeMd(data.employee?.name || name)}*\nDavomi: /app`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      return ctx.reply(`Xato: ${err.message}`);
    }
  }
  return next();
});

function escapeMd(s) {
  return String(s || '').replace(/([_*`\[\]])/g, '\\$1');
}

bot.launch().then(() => {
  console.log('✅ Alcana Xodimlar bot ishga tushdi');
  console.log(`Mini App: ${WEBAPP_URL}`);
  console.log(`API: ${API_BASE}`);
  console.log(`Leader password gate: ${accessEnabled() ? 'ON' : 'OFF'}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
