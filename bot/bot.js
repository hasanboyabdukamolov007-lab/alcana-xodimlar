// Alcana Xodimlar Hujjatlari Telegram Bot
// Long polling (getUpdates). Public commands always work; admin gated by ADMIN_TELEGRAM_IDS.
// Mini App "Telegramga saqlash" uses Vercel env BOT_TOKEN separately — see README.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = String(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '').trim();
const WEBAPP_URL = String(
  process.env.WEBAPP_URL || 'https://alcana-xodimlar.vercel.app'
).replace(/\/$/, '');
const API_BASE = String(process.env.API_BASE_URL || WEBAPP_URL).replace(/\/$/, '');
const ADMIN_API_TOKEN = String(process.env.ADMIN_API_TOKEN || '').trim();

/** Comma/space/semicolon-separated Telegram user IDs allowed to run admin commands. */
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
  console.error("Xato: bot/.env faylida BOT_TOKEN ni qo'ying (BotFather token)!");
  console.error('Namuna: bot/.env.example');
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
  if (!uid || !ADMIN_TELEGRAM_IDS.size) return false;
  return ADMIN_TELEGRAM_IDS.has(uid);
}

function adminDeniedMessage() {
  return (
    '⛔ Bu buyruq faqat adminlar uchun.\n\n' +
    '1) /whoami — o‘z Telegram user ID ni oling\n' +
    '2) bot/.env ga qo‘ying: ADMIN_TELEGRAM_IDS=<sizning_id>\n' +
    '3) Botni to‘xtatib qayta npm start qiling\n\n' +
    'Oddiy foydalanuvchilar: /start /help /app /whoami'
  );
}

async function requireAdmin(ctx, next) {
  if (isAdmin(ctx)) return next();
  await ctx.reply(adminDeniedMessage());
}

/** Prefer Markdown; fall back to plain text if Telegram rejects parse_mode. */
async function safeReply(ctx, text, extra = {}) {
  try {
    return await ctx.reply(text, extra);
  } catch (err) {
    if (extra && extra.parse_mode) {
      const { parse_mode: _ignored, ...rest } = extra;
      return ctx.reply(String(text).replace(/[*_`\[\]]/g, ''), rest);
    }
    throw err;
  }
}

async function api(method, pathName, body) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (ADMIN_API_TOKEN) headers['X-Admin-Token'] = ADMIN_API_TOKEN;

  const res = await fetch(`${API_BASE}${pathName}`, {
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
      '*Admin* (ADMIN\\_TELEGRAM\\_IDS):',
      '🛠 `/admin` — admin menyu',
      '👥 `/list` — xodimlar',
      '🔎 `/docs <ism>` — hujjatlar holati',
      '➕ `/add <Ism Familiya>` — xodim qo‘shish',
      '🗑 `/delete <ism>` — xodim o‘chirish',
      '📷 `/photo` / `/upload` — Mini App orqali yuklash'
    );
  } else {
    lines.push(
      '',
      'Admin buyruqlari faqat ADMIN\\_TELEGRAM\\_IDS dagi userlarga.',
      'ID olish: `/whoami`'
    );
  }
  lines.push('', `Mini App: ${WEBAPP_URL}`);
  return lines.join('\n');
}

function isBotCommandMessage(ctx) {
  const entities = ctx.message?.entities || [];
  return entities.some((e) => e.type === 'bot_command' && e.offset === 0);
}

// ——— Public commands (never require admin) ———

bot.start(async (ctx) => {
  await safeReply(
    ctx,
    '👋 Alcana Xodimlar Hujjatlari.\n\n' +
      'Mini App tugmasi pastda.\n' +
      'Buyruqlar: /help /app /whoami' +
      (isAdmin(ctx) ? '\nSiz adminsiz — /admin' : ''),
    webAppKeyboard()
  );
});

bot.command('help', async (ctx) => {
  await safeReply(ctx, helpText(ctx), { parse_mode: 'Markdown' });
});

bot.command('whoami', async (ctx) => {
  const id = ctx.from?.id;
  const name = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ');
  await safeReply(
    ctx,
    `Sizning Telegram user ID: \`${id}\`\n` +
      `Ism: ${name || '—'}\n` +
      `Admin: ${isAdmin(ctx) ? 'ha' : 'yo‘q'}\n\n` +
      'bot/.env ga qo‘ying:\n' +
      `\`ADMIN_TELEGRAM_IDS=${id}\`\n` +
      '(bir nechta ID: vergul bilan)\n' +
      'Keyin botni restart qiling.',
    { parse_mode: 'Markdown' }
  );
});

bot.command('app', async (ctx) => {
  await ctx.reply(
    'Alcana Xodimlar Mini App:',
    Markup.inlineKeyboard([Markup.button.webApp('📄 Xodimlar hujjatlari', WEBAPP_URL)])
  );
});

// ——— Admin commands ———

bot.command('admin', requireAdmin, async (ctx) => {
  await safeReply(
    ctx,
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
    return safeReply(ctx, 'Xodimlar yo‘q. Qo‘shish: `/add Ism Familiya`', {
      parse_mode: 'Markdown',
    });
  }
  const lines = employees.slice(0, 40).map((e, i) => {
    const pos = e.position?.uz || e.position?.ru || e.position?.en || '';
    return `${i + 1}. *${escapeMd(e.name)}* — ${progressLine(e)} ${pos ? `(${escapeMd(pos)})` : ''}`;
  });
  if (employees.length > 40) lines.push(`… +${employees.length - 40} ta`);
  await safeReply(ctx, `👥 Xodimlar (${employees.length}):\n\n${lines.join('\n')}`, {
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
    return safeReply(ctx, 'Ishlatish: `/docs Karimov`', { parse_mode: 'Markdown' });
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
    await safeReply(
      ctx,
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
      'ADMIN_API_TOKEN bot/.env da yo‘q — yozuv API ishlamaydi.\n' +
        'Vercel dagi ADMIN_API_TOKEN bilan bir xil qiymat qo‘ying, keyin restart.'
    );
  }
  const name = (ctx.message?.text || '').replace(/^\/add\s*/i, '').trim();
  if (!name) {
    conversations.set(chatKey(ctx), { step: 'await_name' });
    return ctx.reply('Yangi xodim ismini yuboring (yoki `/add Ism Familiya`):');
  }
  try {
    const data = await api('POST', '/api/employees', { name, position: {} });
    await safeReply(
      ctx,
      `✅ Qo‘shildi: *${escapeMd(data.employee?.name || name)}*\nHujjat/foto: /app`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    await ctx.reply(`Qo‘shib bo‘lmadi: ${err.message}`);
  }
});

bot.command(['delete', 'remove'], requireAdmin, async (ctx) => {
  if (!ADMIN_API_TOKEN) {
    return ctx.reply('ADMIN_API_TOKEN kerak (bot/.env = Vercel).');
  }
  const query = (ctx.message?.text || '').replace(/^\/\S+\s*/, '').trim();
  if (!query) {
    return safeReply(ctx, 'Ishlatish: `/delete Karimov`', { parse_mode: 'Markdown' });
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

// Conversation follow-up for /add — never swallow slash commands
bot.on('text', async (ctx, next) => {
  if (isBotCommandMessage(ctx)) return next();
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
      return safeReply(ctx, 'Bekor. Qayta: `/add Ism Familiya`', { parse_mode: 'Markdown' });
    }
    try {
      if (!ADMIN_API_TOKEN) {
        return ctx.reply('ADMIN_API_TOKEN kerak.');
      }
      const data = await api('POST', '/api/employees', { name, position: {} });
      return safeReply(
        ctx,
        `✅ Qo‘shildi: *${escapeMd(data.employee?.name || name)}*\nDavomi: /app`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      return ctx.reply(`Xato: ${err.message}`);
    }
  }
  return next();
});

bot.catch(async (err, ctx) => {
  console.error('Bot error', err);
  try {
    await ctx.reply(`Bot xatosi: ${err.message || err}`);
  } catch {
    /* ignore reply failures */
  }
});

async function startBot() {
  // Avoid webhook vs long-polling conflicts (common after deploys / second instance).
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Salomlash + Mini App' },
    { command: 'help', description: 'Buyruqlar ro‘yxati' },
    { command: 'app', description: 'Mini App ochish' },
    { command: 'whoami', description: 'Telegram user ID' },
    { command: 'admin', description: 'Admin menyu (faqat admin)' },
    { command: 'list', description: 'Xodimlar (admin)' },
    { command: 'docs', description: 'Hujjatlar holati (admin)' },
    { command: 'add', description: 'Xodim qo‘shish (admin)' },
    { command: 'delete', description: 'Xodim o‘chirish (admin)' },
  ]);

  await bot.launch({ dropPendingUpdates: true });
  console.log('✅ Alcana Xodimlar bot ishga tushdi (long polling)');
  console.log(`Mini App: ${WEBAPP_URL}`);
  console.log(`API: ${API_BASE}`);
  console.log(
    `Admins (ADMIN_TELEGRAM_IDS): ${
      ADMIN_TELEGRAM_IDS.size ? [...ADMIN_TELEGRAM_IDS].join(', ') : '(none — /admin blocked)'
    }`
  );
  console.log(
    'Eslatma: Mini App «Telegramga saqlash» uchun Vercel Project Settings → Environment Variables → BOT_TOKEN + Redeploy kerak (bot/.env yetarli emas).'
  );
}

startBot().catch((err) => {
  console.error('Bot start failed:', err.message || err);
  if (String(err.message || '').includes('409') || String(err.message || '').includes('Conflict')) {
    console.error(
      'Conflict: boshqa joyda shu BOT_TOKEN bilan bot ishlayapti. Boshqa oynani yoping, keyin qayta npm start.'
    );
  }
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
