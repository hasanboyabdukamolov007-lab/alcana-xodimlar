// Alcana Xodimlar Hujjatlari Telegram Bot
// Public: open Mini App. Admin-only actions gated by ADMIN_TELEGRAM_IDS.

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://alcana-xodimlar.vercel.app';
const API_BASE = (process.env.API_BASE_URL || WEBAPP_URL).replace(/\/$/, '');
const ADMIN_API_TOKEN = String(process.env.ADMIN_API_TOKEN || '').trim();

/** Comma/space-separated Telegram user IDs allowed to run admin commands. */
function parseAdminIds(raw) {
  return new Set(
    String(raw || '')
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

const ADMIN_TELEGRAM_IDS = parseAdminIds(
  process.env.ADMIN_TELEGRAM_IDS || process.env.ADMIN_TG_IDS || ''
);

if (!BOT_TOKEN) {
  console.error("Xato: .env faylida BOT_TOKEN ni qo'ying!");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

/** @type {Map<string, { step: string }>} */
const conversations = new Map();

function chatKey(ctx) {
  return String(ctx.chat?.id || ctx.from?.id || '');
}

function isAdmin(ctx) {
  const uid = ctx.from?.id != null ? String(ctx.from.id) : '';
  if (!uid) return false;
  if (!ADMIN_TELEGRAM_IDS.size) {
    // No admins configured → treat nobody as admin (safer than open).
    return false;
  }
  return ADMIN_TELEGRAM_IDS.has(uid);
}

function adminDeniedMessage() {
  return (
    '⛔ Bu buyruq faqat adminlar uchun.\n\n' +
    'Adminlar `ADMIN_TELEGRAM_IDS` (bot `.env`) dagi Telegram user ID lar.\n' +
    'O‘z ID: /whoami\n' +
    'Oddiy foydalanuvchilar: /app orqali Mini App.'
  );
}

async function requireAdmin(ctx, next) {
  if (isAdmin(ctx)) return next();
  await ctx.reply(adminDeniedMessage());
}

async function api(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
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
  const done = ids.filter(
    (id) => docs[id]?.present || docs[id]?.hasFile || (docs[id]?.files || []).length
  ).length;
  return `${done}/${total}`;
}

function escapeMd(s) {
  return String(s || '').replace(/([_*`\[\]])/g, '\\$1');
}

function webAppKeyboard() {
  return Markup.keyboard([[Markup.button.webApp('📄 Alcana Xodimlar', WEBAPP_URL)]]).resize();
}

function helpText(ctx) {
  const lines = [
    '📋 *Alcana Xodimlar* — bot buyruqlari',
    '',
    '🌐 `/app` — Mini App ochish',
    '🆔 `/whoami` — Telegram user ID (admin ro‘yxatiga qo‘shish uchun)',
    '❓ `/help` — shu yordam',
  ];
  if (isAdmin(ctx)) {
    lines.push(
      '',
      '*Admin* (`ADMIN_TELEGRAM_IDS`):',
      '🛠 `/admin` — admin menyu',
      '👥 `/list` — xodimlar',
      '🔎 `/docs <ism>` — hujjatlar holati',
      '➕ `/add <Ism Familiya>` — xodim qo‘shish',
      '🗑 `/delete <ism>` — xodim o‘chirish',
      '📷 `/photo` / `/upload` — Mini App orqali yuklash'
    );
  } else {
    lines.push('', 'Admin buyruqlari faqat `ADMIN_TELEGRAM_IDS` dagi userlarga.');
  }
  lines.push('', `Mini App: ${WEBAPP_URL}`);
  return lines.join('\n');
}

bot.start(async (ctx) => {
  await ctx.reply(
    '👋 Alcana Xodimlar Hujjatlari.\n\nMini App tugmasi pastda. Buyruqlar: /help' +
      (isAdmin(ctx) ? '\nSiz adminsiz — /admin' : ''),
    webAppKeyboard()
  );
});

bot.command('help', (ctx) => ctx.reply(helpText(ctx), { parse_mode: 'Markdown' }));

bot.command('whoami', async (ctx) => {
  const id = ctx.from?.id;
  const name = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ');
  await ctx.reply(
    `Sizning Telegram user ID: \`${id}\`\nIsm: ${name || '—'}\nAdmin: ${isAdmin(ctx) ? 'ha' : 'yo‘q'}\n\n` +
      'Hasanboy bot `.env` ga qo‘shadi:\n`ADMIN_TELEGRAM_IDS=123456789,987654321`',
    { parse_mode: 'Markdown' }
  );
});

bot.command('app', async (ctx) => {
  await ctx.reply(
    'Alcana Xodimlar Mini App:',
    Markup.inlineKeyboard([Markup.button.webApp('📄 Xodimlar hujjatlari', WEBAPP_URL)])
  );
});

bot.command('admin', requireAdmin, async (ctx) => {
  await ctx.reply(
    '🛠 *Admin menyu*\n\n' +
      '`/list` — xodimlar\n' +
      '`/docs <ism>` — hujjatlar\n' +
      '`/add <Ism Familiya>` — qo‘shish\n' +
      '`/delete <ism>` — o‘chirish\n' +
      '`/photo` / `/upload` — fayl/foto (Mini App)\n' +
      '`/app` — Mini App',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📄 Mini App', WEBAPP_URL)],
        [Markup.button.callback('👥 Ro‘yxat', 'admin:list')],
      ]),
    }
  );
});

async function replyStaffList(ctx) {
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
}

bot.command(['list', 'staff'], requireAdmin, async (ctx) => {
  try {
    await replyStaffList(ctx);
  } catch (err) {
    await ctx.reply(`Xato: ${err.message}`);
  }
});

bot.action('admin:list', requireAdmin, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await replyStaffList(ctx);
  } catch (err) {
    await ctx.reply(`Xato: ${err.message}`);
  }
});

bot.command(['docs', 'employee', 'get'], requireAdmin, async (ctx) => {
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

bot.command('add', requireAdmin, async (ctx) => {
  if (!ADMIN_API_TOKEN) {
    return ctx.reply(
      'ADMIN_API_TOKEN bot `.env` da yo‘q — yozuv API ishlamaydi. Vercel dagi `ADMIN_API_TOKEN` bilan bir xil qiymat qo‘ying.'
    );
  }
  const name = (ctx.message?.text || '').replace(/^\/add\s*/i, '').trim();
  if (!name) {
    conversations.set(chatKey(ctx), { step: 'await_name' });
    return ctx.reply('Yangi xodim ismini yuboring (yoki `/add Ism Familiya`):');
  }
  try {
    const data = await api('POST', '/api/employees', { name, position: {} });
    await ctx.reply(
      `✅ Qo‘shildi: *${escapeMd(data.employee?.name || name)}*\nHujjat/foto: /app`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    await ctx.reply(`Qo‘shib bo‘lmadi: ${err.message}`);
  }
});

bot.command(['delete', 'remove'], requireAdmin, async (ctx) => {
  if (!ADMIN_API_TOKEN) {
    return ctx.reply('ADMIN_API_TOKEN kerak (bot `.env` = Vercel).');
  }
  const query = (ctx.message?.text || '').replace(/^\/\S+\s*/, '').trim();
  if (!query) {
    return ctx.reply('Ishlatish: `/delete Karimov`', { parse_mode: 'Markdown' });
  }
  try {
    const data = await api('GET', '/api/employees');
    const q = query.toLowerCase();
    const matches = (data.employees || []).filter((e) => String(e.name).toLowerCase().includes(q));
    if (!matches.length) return ctx.reply('Topilmadi.');
    if (matches.length > 1) {
      const names = matches.slice(0, 8).map((e) => `• ${e.name}`).join('\n');
      return ctx.reply(`Bir nechta topildi — aniqroq yozing:\n${names}`);
    }
    const emp = matches[0];
    await api('DELETE', `/api/employees/${emp.id}`);
    await ctx.reply(`🗑 O‘chirildi: ${emp.name}`);
  } catch (err) {
    await ctx.reply(`Xato: ${err.message}`);
  }
});

bot.command(['photo', 'upload'], requireAdmin, async (ctx) => {
  await ctx.reply(
    '📷/📎 Foto va hujjat yuklash Mini App orqali.\n\n' +
      '1) /app\n2) Xodim → Yuklash / Rasm tanlash\n3) Kerak bo‘lsa «Telegramga saqlash»',
    Markup.inlineKeyboard([Markup.button.webApp('📄 Mini App', WEBAPP_URL)])
  );
});

bot.on('text', async (ctx, next) => {
  const key = chatKey(ctx);
  const state = conversations.get(key);
  if (!state) return next();
  if (!isAdmin(ctx)) {
    conversations.delete(key);
    return ctx.reply(adminDeniedMessage());
  }
  if (state.step === 'await_name') {
    const name = String(ctx.message.text || '').trim();
    conversations.delete(key);
    if (!name || name.startsWith('/')) {
      return ctx.reply('Bekor. Qayta: `/add Ism Familiya`', { parse_mode: 'Markdown' });
    }
    try {
      if (!ADMIN_API_TOKEN) {
        return ctx.reply('ADMIN_API_TOKEN kerak.');
      }
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

bot.launch().then(() => {
  console.log('✅ Alcana Xodimlar bot ishga tushdi');
  console.log(`Mini App: ${WEBAPP_URL}`);
  console.log(`API: ${API_BASE}`);
  console.log(
    `Admins (ADMIN_TELEGRAM_IDS): ${
      ADMIN_TELEGRAM_IDS.size ? [...ADMIN_TELEGRAM_IDS].join(', ') : '(none configured)'
    }`
  );
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
