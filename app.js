const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Theme
Object.keys(tg.themeParams || {}).forEach(key => {
  if (tg.themeParams[key]) {
    document.documentElement.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, tg.themeParams[key]);
  }
});

// Translations
const i18n = {
  uz: {
    title: "Xodimlar Hujjatlari",
    search: "Xodim qidirish...",
    back: "← Orqaga",
    documents: "Hujjatlar",
    verified: "tasdiqlangan",
    complete: "To'liq",
    incomplete: "To'liq emas",
    upload: "Yuklash",
    addFile: "Yana fayl",
    view: "Ko'rish",
    saveToTelegram: "Telegramga saqlash",
    deleteFile: "O'chirish",
    noFile: "Fayl yo'q",
    filesCount: "fayl",
    fileDate: "Sana",
    fileRequired: "Avval fayl yuklang. Faylsiz belgilash mumkin emas.",
    required: "Majburiy",
    tests: "Test natijalari",
    addEmployee: "Yangi xodim qo'shish",
    editEmployee: "Tahrirlash",
    save: "Saqlash",
    cancel: "Bekor qilish",
    name: "Ism familiya",
    positionUz: "Lavozim (UZ)",
    positionRu: "Lavozim (RU)",
    positionEn: "Lavozim (EN)",
    photoUrl: "Foto (ixtiyoriy)",
    pickPhoto: "Rasm tanlash",
    changePhoto: "Rasmni almashtirish",
    clearPhoto: "O'chirish",
    photoTooLarge: "Rasm juda katta (maks ~3.5MB)",
    photoInvalid: "Faqat rasm fayllari",
    backendReady: "Backend ulangan",
    demoMode: "Demo rejim",
    loading: "Yuklanmoqda...",
    empty: "Xodimlar yo'q. Yangi xodim qo'shing.",
    saveError: "Saqlashda xato",
    loadError: "Ma'lumot yuklanmadi",
    nameRequired: "Ism majburiy",
    uploaded: "Yuklandi",
    sentToTelegram: "Telegramga yuborildi",
    telegramSendError: "Telegramga yuborib bo'lmadi",
    deleteConfirm: "Xodimni o'chirishni tasdiqlaysizmi?",
    deleteFileConfirm: "Bu faylni o'chirasizmi?",
    accessTitle: "Rahbar kirishi",
    accessHint: "Mini App va ma'lumotlar uchun rahbar parolini kiriting.",
    accessLabel: "Parol",
    accessSubmit: "Kirish",
    accessWrong: "Parol noto'g'ri",
    accessNeeded: "Parol talab qilinadi"
  },
  ru: {
    title: "Документы сотрудников",
    search: "Поиск сотрудника...",
    back: "← Назад",
    documents: "Документы",
    verified: "подтверждено",
    complete: "Полный",
    incomplete: "Неполный",
    upload: "Загрузить",
    addFile: "Ещё файл",
    view: "Просмотр",
    saveToTelegram: "Сохранить в Telegram",
    deleteFile: "Удалить",
    noFile: "Нет файла",
    filesCount: "файл(ов)",
    fileDate: "Дата",
    fileRequired: "Сначала загрузите файл. Без файла отметить нельзя.",
    required: "Обязательно",
    tests: "Результаты тестов",
    addEmployee: "Добавить сотрудника",
    editEmployee: "Редактировать",
    save: "Сохранить",
    cancel: "Отмена",
    name: "ФИО",
    positionUz: "Должность (UZ)",
    positionRu: "Должность (RU)",
    positionEn: "Должность (EN)",
    photoUrl: "Фото (необязательно)",
    pickPhoto: "Выбрать фото",
    changePhoto: "Изменить фото",
    clearPhoto: "Удалить",
    photoTooLarge: "Фото слишком большое (макс ~3.5MB)",
    photoInvalid: "Только файлы изображений",
    backendReady: "Backend подключён",
    demoMode: "Демо режим",
    loading: "Загрузка...",
    empty: "Нет сотрудников. Добавьте нового.",
    saveError: "Ошибка сохранения",
    loadError: "Не удалось загрузить данные",
    nameRequired: "Имя обязательно",
    uploaded: "Загружено",
    sentToTelegram: "Отправлено в Telegram",
    telegramSendError: "Не удалось отправить в Telegram",
    deleteConfirm: "Удалить сотрудника?",
    deleteFileConfirm: "Удалить этот файл?",
    accessTitle: "Вход для руководителей",
    accessHint: "Введите пароль руководителя для доступа к Mini App.",
    accessLabel: "Пароль",
    accessSubmit: "Войти",
    accessWrong: "Неверный пароль",
    accessNeeded: "Требуется пароль"
  },
  en: {
    title: "Staff Documents",
    search: "Search staff...",
    back: "← Back",
    documents: "Documents",
    verified: "verified",
    complete: "Complete",
    incomplete: "Incomplete",
    upload: "Upload",
    addFile: "Add file",
    view: "View",
    saveToTelegram: "Save to Telegram",
    deleteFile: "Delete",
    noFile: "No file",
    filesCount: "file(s)",
    fileDate: "Date",
    fileRequired: "Upload a file first. Cannot mark complete without a file.",
    required: "Required",
    tests: "Test Results",
    addEmployee: "Add employee",
    editEmployee: "Edit",
    save: "Save",
    cancel: "Cancel",
    name: "Full name",
    positionUz: "Position (UZ)",
    positionRu: "Position (RU)",
    positionEn: "Position (EN)",
    photoUrl: "Photo (optional)",
    pickPhoto: "Choose photo",
    changePhoto: "Change photo",
    clearPhoto: "Remove",
    photoTooLarge: "Photo too large (max ~3.5MB)",
    photoInvalid: "Only image files",
    backendReady: "Backend connected",
    demoMode: "Demo mode",
    loading: "Loading...",
    empty: "No employees yet. Add one.",
    saveError: "Save failed",
    loadError: "Failed to load data",
    nameRequired: "Name is required",
    uploaded: "Uploaded",
    sentToTelegram: "Sent to Telegram",
    telegramSendError: "Could not send to Telegram",
    deleteConfirm: "Delete this employee?",
    deleteFileConfirm: "Delete this file?",
    accessTitle: "Leader access",
    accessHint: "Enter the leader password to use the Mini App.",
    accessLabel: "Password",
    accessSubmit: "Unlock",
    accessWrong: "Wrong password",
    accessNeeded: "Password required"
  }
};

let currentLang = "uz";
function t(key) { return i18n[currentLang][key] || key; }

const API_BASE = ""; // same origin on Vercel / local server
const MAX_PHOTO_BYTES = 3.5 * 1024 * 1024;
const ACCESS_STORAGE_KEY = "alcana_leader_access";
let backendReady = false;
let accessRequired = false;
let staffMembers = [];
let editingEmployeeId = null;
/** @type {File|null} */
let pendingPhotoFile = null;
let photoCleared = false;
let photoObjectUrl = null;

function getStoredAccessPassword() {
  try {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function setStoredAccessPassword(value) {
  try {
    if (value) sessionStorage.setItem(ACCESS_STORAGE_KEY, value);
    else sessionStorage.removeItem(ACCESS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function consumeAccessQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("access") || params.get("leader_password");
  if (fromQuery) {
    setStoredAccessPassword(fromQuery);
    params.delete("access");
    params.delete("leader_password");
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", next);
  }
}

function withAccessQuery(url) {
  const pwd = getStoredAccessPassword();
  if (!accessRequired || !pwd) return url;
  const abs = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const u = new URL(abs);
  u.searchParams.set("access", pwd);
  return u.toString();
}

const DEMO_STAFF = [
  {
    id: "demo-1",
    name: "Ali Karimov",
    position: { uz: "Dasturchi", ru: "Программист", en: "Software Engineer" },
    photo: "",
    documents: {
      passport: {
        present: true,
        files: [
          { id: "d1", filename: "passport_ali.pdf", date: "2026-10-15", hasFile: true },
          { id: "d2", filename: "passport_ali_page2.pdf", date: "2026-10-16", hasFile: true }
        ]
      },
      photo_3x4: {
        present: true,
        files: [{ id: "d3", filename: "photos_ali.zip", date: "2026-09-01", hasFile: true }]
      },
      contract: {
        present: true,
        files: [{ id: "d4", filename: "contract_ali.pdf", date: "2026-08-20", hasFile: true }]
      },
      personality: {
        present: true,
        files: [{ id: "d5", filename: "16p_ali.pdf", date: "2026-11-05", hasFile: true }]
      },
      iq_test: { present: false, files: [] }
    }
  },
  {
    id: "demo-2",
    name: "Malika Yusupova",
    position: { uz: "HR menejer", ru: "HR менеджер", en: "HR Manager" },
    photo: "",
    documents: {
      passport: {
        present: true,
        files: [{ id: "e1", filename: "passport_malika.pdf", date: "2026-11-01", hasFile: true }]
      },
      photo_3x4: {
        present: true,
        files: [{ id: "e2", filename: "photo_malika.jpg", date: "2026-11-01", hasFile: true }]
      },
      contract: { present: false, files: [] },
      personality: {
        present: true,
        files: [{ id: "e3", filename: "16p_malika.pdf", date: "2026-10-28", hasFile: true }]
      },
      iq_test: {
        present: true,
        files: [{ id: "e4", filename: "mensa_malika.pdf", date: "2026-10-30", hasFile: true }]
      }
    }
  },
  {
    id: "demo-3",
    name: "Jasur Abdullaev",
    position: { uz: "Buxgalter", ru: "Бухгалтер", en: "Accountant" },
    photo: "",
    documents: {
      passport: { present: false, files: [] },
      photo_3x4: {
        present: true,
        files: [{ id: "f1", filename: "photo_jasur.jpg", date: "2026-09-15", hasFile: true }]
      },
      personality: { present: false, files: [] },
      iq_test: { present: false, files: [] }
    }
  }
];

function authHeaders() {
  const headers = {};
  const initData = tg.initData || "";
  if (initData) {
    headers["X-Telegram-Init-Data"] = initData;
  }
  // Optional local/admin testing: ?admin_token=... (do not use in production bookmarks)
  const params = new URLSearchParams(window.location.search);
  const admin = params.get("admin_token");
  if (admin) headers["X-Admin-Token"] = admin;
  const leaderPwd = getStoredAccessPassword();
  if (leaderPwd) headers["X-Leader-Password"] = leaderPwd;
  return headers;
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.getElementById("app-title").textContent = t("title");
  document.getElementById("search-input").placeholder = t("search");
  document.getElementById("back-btn").textContent = t("back");
  document.getElementById("form-title").textContent = editingEmployeeId ? t("editEmployee") : t("addEmployee");
  document.getElementById("label-name").textContent = t("name");
  document.getElementById("label-pos-uz").textContent = t("positionUz");
  document.getElementById("label-pos-ru").textContent = t("positionRu");
  document.getElementById("label-pos-en").textContent = t("positionEn");
  document.getElementById("label-photo").textContent = t("photoUrl");
  const clearBtn = document.getElementById("btn-clear-photo");
  if (clearBtn) clearBtn.textContent = t("clearPhoto");
  updatePhotoPickLabel();
  document.getElementById("form-save").textContent = t("save");
  document.getElementById("form-cancel").textContent = t("cancel");
  document.getElementById("access-title").textContent = t("accessTitle");
  document.getElementById("access-hint").textContent = t("accessHint");
  document.getElementById("label-access").textContent = t("accessLabel");
  document.getElementById("access-submit").textContent = t("accessSubmit");
  updateStatusBadge();
  tg.MainButton.setText(t("addEmployee"));
  renderStaffList();
  if (!document.getElementById("staff-detail").classList.contains("hidden")) {
    const id = window.currentStaffId;
    if (id) showStaffDetail(id);
  }
}

function showAccessGate(show, errorMsg = "") {
  const gate = document.getElementById("access-gate");
  const err = document.getElementById("access-error");
  if (!gate) return;
  gate.classList.toggle("hidden", !show);
  if (err) {
    if (errorMsg) {
      err.textContent = errorMsg;
      err.classList.remove("hidden");
    } else {
      err.textContent = "";
      err.classList.add("hidden");
    }
  }
  if (show) {
    tg.MainButton.hide();
    document.getElementById("input-access")?.focus();
  }
}

function updatePhotoPickLabel() {
  const btn = document.getElementById("btn-pick-photo");
  const preview = document.getElementById("photo-preview");
  if (!btn) return;
  const hasPreview = preview && !preview.classList.contains("hidden") && preview.getAttribute("src");
  btn.textContent = hasPreview ? t("changePhoto") : t("pickPhoto");
}

function revokePhotoObjectUrl() {
  if (photoObjectUrl) {
    URL.revokeObjectURL(photoObjectUrl);
    photoObjectUrl = null;
  }
}

function setPhotoPreview(src) {
  const img = document.getElementById("photo-preview");
  const empty = document.getElementById("photo-preview-empty");
  const clearBtn = document.getElementById("btn-clear-photo");
  if (src) {
    img.src = src;
    img.classList.remove("hidden");
    empty.classList.add("hidden");
    clearBtn.classList.remove("hidden");
  } else {
    img.removeAttribute("src");
    img.classList.add("hidden");
    empty.classList.remove("hidden");
    clearBtn.classList.add("hidden");
  }
  updatePhotoPickLabel();
}

function resetPhotoPickerState() {
  pendingPhotoFile = null;
  photoCleared = false;
  revokePhotoObjectUrl();
  const fileInput = document.getElementById("input-photo-file");
  if (fileInput) fileInput.value = "";
}

function employeePhotoSrc(emp) {
  if (!isRealPhoto(emp?.photo)) return "";
  let src = emp.photo;
  if (src.startsWith("/api/") && emp.updatedAt) {
    src = `${src}${src.includes("?") ? "&" : "?"}t=${encodeURIComponent(emp.updatedAt)}`;
  }
  if (src.startsWith("/api/")) {
    return withAccessQuery(`${window.location.origin}${src}`);
  }
  return src;
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.onclick = () => setLang(btn.dataset.lang);
});

// Required documents (updated checklist)
const REQUIRED_DOCS = [
  { id: "personal_info", names: { uz: "Xodimning shaxsiy ma'lumoti", ru: "Личные данные сотрудника", en: "Personal Information Form" }, desc: { uz: "To'ldirilgan shaxsiy anketa", ru: "Заполненная анкета", en: "Completed personal form" } },
  { id: "application", names: { uz: "Ishga olish ankеtasi", ru: "Анкета при приеме на работу", en: "Employment Application Form" }, desc: { uz: "Ishga kirish ankеtasi", ru: "Анкета", en: "Job application" } },
  { id: "passport", names: { uz: "Pasport nusxasi", ru: "Копия паспорта", en: "Passport Copy" }, desc: { uz: "Pasportning barcha sahifalari", ru: "Все страницы паспорта", en: "All passport pages" } },
  { id: "photo_3x4", names: { uz: "3x4 rasm (8 dona)", ru: "Фото 3x4 (8 шт)", en: "3x4 Photos (8 pieces)" }, desc: { uz: "Rasmiy fotosuratlar", ru: "Официальные фото", en: "Official photos" } },
  { id: "inn", names: { uz: "INN", ru: "ИНН", en: "INN (Tax ID)" }, desc: { uz: "Soliq identifikatori", ru: "Налоговый номер", en: "Tax identification number" } },
  { id: "company_form", names: { uz: "Korxona ankеtasi", ru: "Анкета предприятия", en: "Company Questionnaire" }, desc: { uz: "Ichki korxona ankеtasi", ru: "Внутренняя анкета", en: "Internal company form" } },
  { id: "contract", names: { uz: "Mehnat shartnomasi", ru: "Трудовой договор", en: "Employment Contract" }, desc: { uz: "Imzolangan mehnat shartnomasi", ru: "Подписанный договор", en: "Signed labor contract" } },
  { id: "safety", names: { uz: "Texnika xavfsizligi", ru: "Техника безопасности", en: "Safety Training" }, desc: { uz: "Mehnat muhofazasi bo'yicha yo'riqnoma", ru: "Инструктаж по охране труда", en: "Occupational safety briefing" } },
  { id: "nps", names: { uz: "NPS", ru: "NPS", en: "NPS" }, desc: { uz: "NPS so'rovnomasi / natijasi", ru: "Анкета / результат NPS", en: "NPS survey / result" } },
  { id: "life_wheel", names: { uz: "Hayot g'ildiragi", ru: "Колесо жизни", en: "Wheel of Life" }, desc: { uz: "Hayot g'ildiragi testi", ru: "Тест «Колесо жизни»", en: "Wheel of Life assessment" } },
  { id: "currency_pledge", names: { uz: "Valyutaga qarshi tilxat", ru: "Расписка против валюты", en: "Anti-currency pledge" }, desc: { uz: "Valyuta qoidalari bo'yicha tilxat", ru: "Расписка по валютным правилам", en: "Pledge regarding currency rules" } },
  { id: "illegal_info_pledge", names: { uz: "Noqonuniy ma'lumotlardan foydalanmaslik tilxati", ru: "Расписка о неиспользовании незаконной информации", en: "Illegal information non-use pledge" }, desc: { uz: "Noqonuniy ma'lumotlarga oid tilxat", ru: "Расписка о незаконной информации", en: "Pledge not to use illegal information" } },
  { id: "personality", names: { uz: "16Personalities test natijasi", ru: "Результат теста 16Personalities", en: "16Personalities Test Result" }, desc: { uz: "Shaxsiyat testi natijasi (PDF/screenshot)", ru: "Результат теста личности", en: "Personality test result" } },
  { id: "iq_test", names: { uz: "Mensa IQ test natijasi", ru: "Результат теста Mensa IQ", en: "Mensa IQ Test Result" }, desc: { uz: "IQ testi natijasi", ru: "Результат IQ теста", en: "IQ test result" } }
];

function isRealPhoto(photo) {
  if (!photo || typeof photo !== "string") return false;
  const p = photo.trim();
  if (!p) return false;
  if (/pravatar\.cc/i.test(p)) return false;
  return true;
}

function initialsFromName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function docFiles(data) {
  if (!data) return [];
  if (Array.isArray(data.files) && data.files.length) {
    return data.files.filter((f) => f && (f.hasFile || f.url || f.filename));
  }
  // Legacy single-file shape
  if (data.hasFile || data.url || data.filename) {
    return [{
      id: data.id || "legacy",
      filename: data.filename,
      date: data.date,
      url: data.url,
      mimeType: data.mimeType,
      hasFile: true
    }];
  }
  return [];
}

function hasDocFile(data) {
  return docFiles(data).length > 0;
}

function isDocComplete(data) {
  return hasDocFile(data);
}

function avatarHtml(staff, extraStyle = "") {
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : "";
  const initials = escapeHtml(initialsFromName(staff.name));
  const src = employeePhotoSrc(staff);
  if (src) {
    return `<img class="avatar" src="${escapeHtml(src)}" alt=""${styleAttr} onerror="replaceBrokenAvatar(this,'${initials}')">`;
  }
  return `<div class="avatar avatar-initials"${styleAttr} aria-hidden="true">${initials}</div>`;
}

window.replaceBrokenAvatar = function(img, initials) {
  const div = document.createElement("div");
  div.className = "avatar avatar-initials";
  div.textContent = initials || "?";
  if (img.getAttribute("style")) div.setAttribute("style", img.getAttribute("style"));
  img.replaceWith(div);
};

function normalizeEmployee(raw) {
  const documents = {};
  REQUIRED_DOCS.forEach(doc => {
    const src = raw.documents?.[doc.id] || { present: false, files: [] };
    const files = docFiles(src);
    const complete = files.length > 0;
    documents[doc.id] = {
      ...src,
      files,
      present: complete,
      hasFile: complete,
      filename: files[0]?.filename,
      date: files[0]?.date,
      url: files[0]?.url
    };
  });
  return {
    id: raw.id,
    name: raw.name,
    position: {
      uz: raw.position?.uz || "",
      ru: raw.position?.ru || "",
      en: raw.position?.en || ""
    },
    photo: isRealPhoto(raw.photo) ? raw.photo.trim() : "",
    updatedAt: raw.updatedAt || raw.updated_at || "",
    documents
  };
}

function updateStatusBadge() {
  const el = document.getElementById("user-info");
  const user = tg.initDataUnsafe?.user;
  const who = user ? `${user.first_name} ${user.last_name || ""}`.trim() : "";
  const mode = backendReady ? t("backendReady") : t("demoMode");
  el.textContent = who ? `${who} · ${mode}` : mode;
}

function calculateProgress(staff) {
  const total = REQUIRED_DOCS.length;
  const completed = REQUIRED_DOCS.filter(doc => isDocComplete(staff.documents[doc.id])).length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

function renderStaffList() {
  const query = (document.getElementById("search-input").value || "").toLowerCase();
  const container = document.getElementById("staff-cards");
  container.innerHTML = "";

  const filtered = staffMembers.filter(s => s.name.toLowerCase().includes(query));
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">${t("empty")}</div>`;
    return;
  }

  filtered.forEach(staff => {
    const p = calculateProgress(staff);
    const complete = p.percent === 100;
    const card = document.createElement("div");
    card.className = "staff-card";
    card.onclick = () => showStaffDetail(staff.id);
    card.innerHTML = `
      ${avatarHtml(staff)}
      <div class="staff-info">
        <div class="staff-name">${escapeHtml(staff.name)}</div>
        <div style="font-size:0.82rem;color:var(--tg-theme-hint-color)">${escapeHtml(staff.position[currentLang] || "")}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${p.percent}%"></div></div>
        <div class="progress-text">
          <span>${p.completed}/${p.total} ${t("verified")}</span>
          <span class="status-badge ${complete ? "status-complete" : "status-incomplete"}">${complete ? t("complete") : t("incomplete")}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fileListHtml(staffId, docId, files) {
  if (!files.length) {
    return `<div class="file-info">${t("noFile")}</div>`;
  }
  return `
    <ul class="file-list">
      ${files.map((f) => `
        <li class="file-row">
          <div class="file-meta">
            <span class="file-name">📄 ${escapeHtml(f.filename || docId)}</span>
            <label class="file-date-label">
              ${t("fileDate")}
              <input type="date" class="file-date-input"
                value="${escapeHtml(f.date || "")}"
                ${backendReady && f.id && f.id !== "legacy" ? `onchange="updateFileDate('${staffId}','${docId}','${f.id}', this.value)"` : "disabled"}>
            </label>
          </div>
          <div class="file-actions">
            <button type="button" class="view-btn" onclick="viewFile('${staffId}','${docId}','${f.id || ""}')">${t("view")}</button>
            ${backendReady && f.id && f.id !== "legacy"
              ? `<button type="button" class="tg-save-btn" onclick="saveFileToTelegram('${staffId}','${docId}','${f.id}')">${t("saveToTelegram")}</button>
                 <button type="button" class="danger-btn" onclick="removeFile('${staffId}','${docId}','${f.id}')">${t("deleteFile")}</button>`
              : ""}
          </div>
        </li>
      `).join("")}
    </ul>
  `;
}

function showStaffDetail(id) {
  window.currentStaffId = id;
  const staff = staffMembers.find(s => s.id === id);
  if (!staff) return;

  document.getElementById("staff-list").classList.add("hidden");
  document.getElementById("staff-detail").classList.remove("hidden");
  document.getElementById("employee-form").classList.add("hidden");
  tg.MainButton.hide();

  const p = calculateProgress(staff);
  let html = `
    <div style="text-align:center;margin-bottom:16px;">
      ${avatarHtml(staff, "width:80px;height:80px;font-size:1.6rem;")}
      <h2 style="margin:8px 0 4px;">${escapeHtml(staff.name)}</h2>
      <div style="color:var(--tg-theme-hint-color)">${escapeHtml(staff.position[currentLang] || "")}</div>
      <div style="margin-top:8px;font-weight:600;">${p.completed}/${p.total} ${t("verified")}</div>
      ${backendReady ? `<button class="btn btn-secondary" style="margin-top:10px;" onclick="openEmployeeForm('${staff.id}')">${t("editEmployee")}</button>` : ""}
    </div>
    <h3 style="margin-bottom:8px;">${t("documents")}</h3>
  `;

  REQUIRED_DOCS.forEach(doc => {
    const data = staff.documents[doc.id] || { present: false, files: [] };
    const files = docFiles(data);
    const checked = files.length > 0;
    html += `
      <div class="doc-item">
        <div class="checkbox ${checked ? "checked" : ""}" onclick="toggleDoc('${id}', '${doc.id}')">${checked ? "✓" : ""}</div>
        <div class="doc-content">
          <div class="doc-name">${doc.names[currentLang]}</div>
          <div class="doc-desc">${doc.desc[currentLang]}</div>
          <div class="file-info">${files.length ? `${files.length} ${t("filesCount")}` : t("noFile")}</div>
          ${fileListHtml(id, doc.id, files)}
          <div class="upload-row">
            <label class="file-date-label">
              ${t("fileDate")}
              <input type="date" id="upload-date-${doc.id}" class="file-date-input" value="${new Date().toISOString().split("T")[0]}">
            </label>
            <button type="button" class="upload-btn" onclick="uploadDoc('${id}', '${doc.id}')">${checked ? t("addFile") : t("upload")}</button>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById("detail-content").innerHTML = html;
}

document.getElementById("back-btn").onclick = () => {
  document.getElementById("staff-detail").classList.add("hidden");
  document.getElementById("employee-form").classList.add("hidden");
  document.getElementById("staff-list").classList.remove("hidden");
  if (backendReady) tg.MainButton.show();
  renderStaffList();
};

document.getElementById("search-input").oninput = renderStaffList;

window.toggleDoc = async function(staffId, docId) {
  const staff = staffMembers.find(s => s.id === staffId);
  if (!staff) return;
  if (!staff.documents[docId]) staff.documents[docId] = { present: false, files: [] };
  const currentlyComplete = isDocComplete(staff.documents[docId]);
  const next = !currentlyComplete;

  if (next && !hasDocFile(staff.documents[docId])) {
    tg.showAlert(t("fileRequired"));
    tg.HapticFeedback?.notificationOccurred?.("error");
    return;
  }

  if (backendReady) {
    try {
      const data = await api(`/api/employees/${staffId}/docs/${docId}`, {
        method: "PATCH",
        body: JSON.stringify({ present: next })
      });
      replaceEmployee(data.employee);
    } catch (err) {
      const msg = err.message || "";
      if (err.data?.code === "FILE_REQUIRED" || /file required/i.test(msg)) {
        tg.showAlert(t("fileRequired"));
      } else {
        tg.showAlert(`${t("saveError")}: ${msg}`);
      }
      return;
    }
  } else {
    if (!next) {
      staff.documents[docId] = { present: false, files: [] };
    } else {
      staff.documents[docId].present = true;
      staff.documents[docId].hasFile = true;
    }
  }
  showStaffDetail(staffId);
  tg.HapticFeedback?.impactOccurred("light");
};

window.uploadDoc = function(staffId, docId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip";
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) return;
    const dateEl = document.getElementById(`upload-date-${docId}`);
    const date = (dateEl && dateEl.value) || new Date().toISOString().split("T")[0];

    if (backendReady) {
      try {
        const base64 = await fileToBase64(file);
        const data = await api(`/api/employees/${staffId}/docs/${docId}`, {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            data: base64,
            date
          })
        });
        replaceEmployee(data.employee);
        showStaffDetail(staffId);
        tg.showAlert(`${t("uploaded")}: ${file.name}`);
      } catch (err) {
        tg.showAlert(`${t("saveError")}: ${err.message}`);
      }
      return;
    }

    if (!staff.documents[docId]) staff.documents[docId] = { present: false, files: [] };
    if (!Array.isArray(staff.documents[docId].files)) staff.documents[docId].files = [];
    staff.documents[docId].files.push({
      id: `demo-${Date.now()}`,
      filename: file.name,
      date,
      hasFile: true
    });
    staff.documents[docId].present = true;
    staff.documents[docId].hasFile = true;
    showStaffDetail(staffId);
    tg.showAlert(`${t("uploaded")}: ${file.name}`);
  };
  input.click();
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.viewFile = function(staffId, docId, fileId) {
  const staff = staffMembers.find(s => s.id === staffId);
  const files = docFiles(staff?.documents?.[docId]);
  const file = files.find((f) => f.id === fileId) || files[0];
  if (!file) return;

  if (backendReady && file.id && file.id !== "legacy") {
    const raw = file.url || `/api/files/${staffId}/${docId}/${file.id}`;
    const url = withAccessQuery(raw.startsWith("http") ? raw : `${window.location.origin}${raw}`);
    if (tg.openLink) tg.openLink(url);
    else window.open(url, "_blank");
    return;
  }
  if (backendReady) {
    const raw = file.url || `/api/files/${staffId}/${docId}`;
    const url = withAccessQuery(raw.startsWith("http") ? raw : `${window.location.origin}${raw}`);
    if (tg.openLink) tg.openLink(url);
    else window.open(url, "_blank");
    return;
  }
  tg.showAlert(`Hujjat: ${file.filename || docId}`);
};

window.viewDoc = function(staffId, docId) {
  const files = docFiles(staffMembers.find(s => s.id === staffId)?.documents?.[docId]);
  if (files[0]) window.viewFile(staffId, docId, files[0].id);
};

window.updateFileDate = async function(staffId, docId, fileId, date) {
  if (!backendReady || !date) return;
  try {
    const data = await api(`/api/employees/${staffId}/docs/${docId}/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({ date })
    });
    replaceEmployee(data.employee);
    showStaffDetail(staffId);
  } catch (err) {
    tg.showAlert(`${t("saveError")}: ${err.message}`);
  }
};

window.removeFile = async function(staffId, docId, fileId) {
  if (!backendReady) return;
  if (!window.confirm(t("deleteFileConfirm"))) return;
  try {
    const data = await api(`/api/employees/${staffId}/docs/${docId}/files/${fileId}`, {
      method: "DELETE"
    });
    replaceEmployee(data.employee);
    showStaffDetail(staffId);
  } catch (err) {
    tg.showAlert(`${t("saveError")}: ${err.message}`);
  }
};

window.saveFileToTelegram = async function(staffId, docId, fileId) {
  if (!backendReady) return;
  try {
    await api("/api/telegram/send-document", {
      method: "POST",
      body: JSON.stringify({ employeeId: staffId, docId, fileId })
    });
    tg.showAlert(t("sentToTelegram"));
    tg.HapticFeedback?.notificationOccurred?.("success");
  } catch (err) {
    tg.showAlert(`${t("telegramSendError")}: ${err.message}`);
  }
};

function replaceEmployee(raw) {
  const normalized = normalizeEmployee(raw);
  const idx = staffMembers.findIndex(s => s.id === normalized.id);
  if (idx >= 0) staffMembers[idx] = normalized;
  else staffMembers.push(normalized);
}

window.openEmployeeForm = function(id) {
  if (!backendReady) {
    tg.showAlert("Yangi xodim qo'shish formasi ochiladi (backend kerak)");
    return;
  }
  editingEmployeeId = id || null;
  resetPhotoPickerState();
  document.getElementById("staff-list").classList.add("hidden");
  document.getElementById("staff-detail").classList.add("hidden");
  document.getElementById("employee-form").classList.remove("hidden");
  tg.MainButton.hide();

  document.getElementById("form-title").textContent = editingEmployeeId ? t("editEmployee") : t("addEmployee");
  const emp = editingEmployeeId ? staffMembers.find(s => s.id === editingEmployeeId) : null;
  document.getElementById("input-name").value = emp?.name || "";
  document.getElementById("input-pos-uz").value = emp?.position?.uz || "";
  document.getElementById("input-pos-ru").value = emp?.position?.ru || "";
  document.getElementById("input-pos-en").value = emp?.position?.en || "";
  setPhotoPreview(employeePhotoSrc(emp));
};

document.getElementById("input-photo-file").onchange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
    tg.showAlert(t("photoInvalid"));
    e.target.value = "";
    return;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    tg.showAlert(t("photoTooLarge"));
    e.target.value = "";
    return;
  }
  pendingPhotoFile = file;
  photoCleared = false;
  revokePhotoObjectUrl();
  photoObjectUrl = URL.createObjectURL(file);
  setPhotoPreview(photoObjectUrl);
};

document.getElementById("btn-clear-photo").onclick = () => {
  pendingPhotoFile = null;
  photoCleared = true;
  revokePhotoObjectUrl();
  document.getElementById("input-photo-file").value = "";
  setPhotoPreview("");
};

document.getElementById("form-cancel").onclick = () => {
  resetPhotoPickerState();
  document.getElementById("employee-form").classList.add("hidden");
  if (editingEmployeeId) {
    showStaffDetail(editingEmployeeId);
  } else {
    document.getElementById("staff-list").classList.remove("hidden");
    tg.MainButton.show();
  }
};

async function uploadEmployeePhoto(employeeId, file) {
  const base64 = await fileToBase64(file);
  const data = await api(`/api/employees/${employeeId}/photo`, {
    method: "POST",
    body: JSON.stringify({
      filename: file.name || "photo.jpg",
      mimeType: file.type || "image/jpeg",
      data: base64
    })
  });
  return data.employee;
}

document.getElementById("employee-form-el").onsubmit = async (e) => {
  e.preventDefault();
  if (!backendReady) return;

  const name = document.getElementById("input-name").value.trim();
  if (!name) {
    tg.showAlert(t("nameRequired"));
    return;
  }

  const payload = {
    name,
    position: {
      uz: document.getElementById("input-pos-uz").value.trim(),
      ru: document.getElementById("input-pos-ru").value.trim(),
      en: document.getElementById("input-pos-en").value.trim()
    }
  };

  const saveBtn = document.getElementById("form-save");
  saveBtn.disabled = true;
  try {
    let data;
    if (editingEmployeeId) {
      data = await api(`/api/employees/${editingEmployeeId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      data = await api("/api/employees", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    let employee = data.employee;
    if (pendingPhotoFile) {
      employee = await uploadEmployeePhoto(employee.id, pendingPhotoFile);
    } else if (photoCleared && editingEmployeeId) {
      const cleared = await api(`/api/employees/${employee.id}/photo`, { method: "DELETE" });
      employee = cleared.employee;
    }

    resetPhotoPickerState();
    replaceEmployee(employee);
    document.getElementById("employee-form").classList.add("hidden");
    showStaffDetail(employee.id);
    tg.HapticFeedback?.notificationOccurred("success");
  } catch (err) {
    tg.showAlert(`${t("saveError")}: ${err.message}`);
  } finally {
    saveBtn.disabled = false;
  }
};

async function loadFromBackend() {
  try {
    const health = await api("/api/health");
    if (!health.ok || !health.backend) return false;
    backendReady = true;
    accessRequired = Boolean(health.accessRequired);
    if (accessRequired && !getStoredAccessPassword()) {
      return "need_access";
    }
    try {
      const list = await api("/api/employees");
      staffMembers = (list.employees || []).map(normalizeEmployee);
      return true;
    } catch (err) {
      if (err.data?.code === "LEADER_PASSWORD_REQUIRED" || err.status === 401) {
        accessRequired = true;
        setStoredAccessPassword("");
        return "need_access";
      }
      throw err;
    }
  } catch {
    backendReady = false;
    return false;
  }
}

async function unlockWithPassword(password) {
  setStoredAccessPassword(password);
  try {
    const list = await api("/api/employees");
    staffMembers = (list.employees || []).map(normalizeEmployee);
    showAccessGate(false);
    updateStatusBadge();
    renderStaffList();
    if (backendReady) {
      tg.MainButton.setText(t("addEmployee"));
      tg.MainButton.show();
      tg.MainButton.onClick(() => openEmployeeForm(null));
    }
    return true;
  } catch (err) {
    setStoredAccessPassword("");
    showAccessGate(true, t("accessWrong"));
    return false;
  }
}

document.getElementById("access-form").onsubmit = async (e) => {
  e.preventDefault();
  const pwd = document.getElementById("input-access").value.trim();
  if (!pwd) {
    showAccessGate(true, t("accessNeeded"));
    return;
  }
  document.getElementById("access-submit").disabled = true;
  try {
    await unlockWithPassword(pwd);
  } finally {
    document.getElementById("access-submit").disabled = false;
  }
};

async function init() {
  consumeAccessQueryParam();
  document.getElementById("staff-cards").innerHTML = `<div class="empty-state">${t("loading")}</div>`;
  setLang("uz");
  const ok = await loadFromBackend();
  if (ok === "need_access") {
    showAccessGate(true);
    document.getElementById("staff-cards").innerHTML = `<div class="empty-state">${t("accessNeeded")}</div>`;
    updateStatusBadge();
    return;
  }
  if (!ok) {
    staffMembers = DEMO_STAFF.map(normalizeEmployee);
  }
  showAccessGate(false);
  updateStatusBadge();
  renderStaffList();

  tg.MainButton.setText(t("addEmployee"));
  if (backendReady) {
    tg.MainButton.show();
    tg.MainButton.onClick(() => openEmployeeForm(null));
  } else {
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      tg.showAlert("Yangi xodim qo'shish formasi ochiladi (backend kerak)");
    });
  }
}

init();
