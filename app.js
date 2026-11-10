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
    view: "Ko'rish",
    noFile: "Fayl yo'q",
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
    photoUrl: "Foto URL (ixtiyoriy)",
    backendReady: "Backend ulangan",
    demoMode: "Demo rejim",
    loading: "Yuklanmoqda...",
    empty: "Xodimlar yo'q. Yangi xodim qo'shing.",
    saveError: "Saqlashda xato",
    loadError: "Ma'lumot yuklanmadi",
    nameRequired: "Ism majburiy",
    uploaded: "Yuklandi",
    deleteConfirm: "Xodimni o'chirishni tasdiqlaysizmi?"
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
    view: "Просмотр",
    noFile: "Нет файла",
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
    photoUrl: "URL фото (необязательно)",
    backendReady: "Backend подключён",
    demoMode: "Демо режим",
    loading: "Загрузка...",
    empty: "Нет сотрудников. Добавьте нового.",
    saveError: "Ошибка сохранения",
    loadError: "Не удалось загрузить данные",
    nameRequired: "Имя обязательно",
    uploaded: "Загружено",
    deleteConfirm: "Удалить сотрудника?"
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
    view: "View",
    noFile: "No file",
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
    photoUrl: "Photo URL (optional)",
    backendReady: "Backend connected",
    demoMode: "Demo mode",
    loading: "Loading...",
    empty: "No employees yet. Add one.",
    saveError: "Save failed",
    loadError: "Failed to load data",
    nameRequired: "Name is required",
    uploaded: "Uploaded",
    deleteConfirm: "Delete this employee?"
  }
};

let currentLang = "uz";
function t(key) { return i18n[currentLang][key] || key; }

const API_BASE = ""; // same origin on Vercel / local server
let backendReady = false;
let staffMembers = [];
let editingEmployeeId = null;

const DEMO_STAFF = [
  {
    id: "demo-1",
    name: "Ali Karimov",
    position: { uz: "Dasturchi", ru: "Программист", en: "Software Engineer" },
    photo: "",
    documents: {
      passport: { present: true, filename: "passport_ali.pdf", date: "2026-10-15", hasFile: true },
      photo_3x4: { present: true, filename: "photos_ali.zip", date: "2026-09-01", hasFile: true },
      contract: { present: true, filename: "contract_ali.pdf", date: "2026-08-20", hasFile: true },
      personality: { present: true, filename: "16p_ali.pdf", date: "2026-11-05", hasFile: true },
      iq_test: { present: false }
    }
  },
  {
    id: "demo-2",
    name: "Malika Yusupova",
    position: { uz: "HR menejer", ru: "HR менеджер", en: "HR Manager" },
    photo: "",
    documents: {
      passport: { present: true, filename: "passport_malika.pdf", date: "2026-11-01", hasFile: true },
      photo_3x4: { present: true, filename: "photo_malika.jpg", date: "2026-11-01", hasFile: true },
      contract: { present: false },
      personality: { present: true, filename: "16p_malika.pdf", date: "2026-10-28", hasFile: true },
      iq_test: { present: true, filename: "mensa_malika.pdf", date: "2026-10-30", hasFile: true }
    }
  },
  {
    id: "demo-3",
    name: "Jasur Abdullaev",
    position: { uz: "Buxgalter", ru: "Бухгалтер", en: "Accountant" },
    photo: "",
    documents: {
      passport: { present: false },
      photo_3x4: { present: true, filename: "photo_jasur.jpg", date: "2026-09-15", hasFile: true },
      personality: { present: false },
      iq_test: { present: false }
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
  document.getElementById("form-save").textContent = t("save");
  document.getElementById("form-cancel").textContent = t("cancel");
  updateStatusBadge();
  tg.MainButton.setText(t("addEmployee"));
  renderStaffList();
  if (!document.getElementById("staff-detail").classList.contains("hidden")) {
    const id = window.currentStaffId;
    if (id) showStaffDetail(id);
  }
}

document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.onclick = () => setLang(btn.dataset.lang);
});

// Required documents (from image + tests)
const REQUIRED_DOCS = [
  { id: "personal_info", names: { uz: "Xodimning shaxsiy ma'lumoti", ru: "Личные данные сотрудника", en: "Personal Information Form" }, desc: { uz: "To'ldirilgan shaxsiy anketa", ru: "Заполненная анкета", en: "Completed personal form" } },
  { id: "application", names: { uz: "Ishga olish ankеtasi", ru: "Анкета при приеме на работу", en: "Employment Application Form" }, desc: { uz: "Ishga kirish ankеtasi", ru: "Анкета", en: "Job application" } },
  { id: "passport", names: { uz: "Pasport nusxasi", ru: "Копия паспорта", en: "Passport Copy" }, desc: { uz: "Pasportning barcha sahifalari", ru: "Все страницы паспорта", en: "All passport pages" } },
  { id: "photo_3x4", names: { uz: "3x4 rasm (8 dona)", ru: "Фото 3x4 (8 шт)", en: "3x4 Photos (8 pieces)" }, desc: { uz: "Rasmiy fotosuratlar", ru: "Официальные фото", en: "Official photos" } },
  { id: "inn", names: { uz: "INN", ru: "ИНН", en: "INN (Tax ID)" }, desc: { uz: "Soliq identifikatori", ru: "Налоговый номер", en: "Tax identification number" } },
  { id: "company_form", names: { uz: "Korxona ankеtasi", ru: "Анкета предприятия", en: "Company Questionnaire" }, desc: { uz: "Ichki korxona ankеtasi", ru: "Внутренняя анкета", en: "Internal company form" } },
  { id: "contract", names: { uz: "Mehnat shartnomasi", ru: "Трудовой договор", en: "Employment Contract" }, desc: { uz: "Imzolangan mehnat shartnomasi", ru: "Подписанный договор", en: "Signed labor contract" } },
  { id: "safety", names: { uz: "Texnika xavfsizligi", ru: "Техника безопасности", en: "Safety Training" }, desc: { uz: "Mehnat muhofazasi bo'yicha yo'riqnoma", ru: "Инструктаж по охране труда", en: "Occupational safety briefing" } },
  { id: "no_criminal", names: { uz: "Sudlanmaganligi haqida ma'lumotnoma", ru: "Справка об отсутствии судимости", en: "No Criminal Record Certificate" }, desc: { uz: "Ma'lumotnoma", ru: "Справка", en: "Certificate" } },
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

function hasDocFile(data) {
  if (!data) return false;
  return Boolean(data.hasFile || data.url || data.filename);
}

function isDocComplete(data) {
  // Confirmed only when a file exists (upload auto-marks present).
  return hasDocFile(data);
}

function avatarHtml(staff, extraStyle = "") {
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : "";
  const initials = escapeHtml(initialsFromName(staff.name));
  if (isRealPhoto(staff.photo)) {
    return `<img class="avatar" src="${escapeHtml(staff.photo)}" alt=""${styleAttr} onerror="replaceBrokenAvatar(this,'${initials}')">`;
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
    const src = raw.documents?.[doc.id] || { present: false };
    const complete = isDocComplete(src);
    documents[doc.id] = {
      ...src,
      present: complete,
      hasFile: complete
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
    const data = staff.documents[doc.id] || { present: false };
    const checked = isDocComplete(data);
    const canView = checked;
    html += `
      <div class="doc-item">
        <div class="checkbox ${checked ? "checked" : ""}" onclick="toggleDoc('${id}', '${doc.id}')">${checked ? "✓" : ""}</div>
        <div class="doc-content">
          <div class="doc-name">${doc.names[currentLang]}</div>
          <div class="doc-desc">${doc.desc[currentLang]}</div>
          <div class="file-info">${data.filename ? `📄 ${escapeHtml(data.filename)} • ${data.date || ""}` : t("noFile")}</div>
        </div>
        <div class="actions">
          ${canView
            ? `<button class="view-btn" onclick="viewDoc('${id}', '${doc.id}')">${t("view")}</button>`
            : `<button class="upload-btn" onclick="uploadDoc('${id}', '${doc.id}')">${t("upload")}</button>`}
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
  if (!staff.documents[docId]) staff.documents[docId] = { present: false };
  const currentlyComplete = isDocComplete(staff.documents[docId]);
  const next = !currentlyComplete;

  // Completing without a file is not allowed — warn and keep unchecked.
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
      staff.documents[docId] = { present: false };
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

    if (backendReady) {
      try {
        const base64 = await fileToBase64(file);
        const data = await api(`/api/employees/${staffId}/docs/${docId}`, {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            data: base64
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

    staff.documents[docId] = {
      present: true,
      filename: file.name,
      date: new Date().toISOString().split("T")[0]
    };
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

window.viewDoc = function(staffId, docId) {
  const staff = staffMembers.find(s => s.id === staffId);
  const data = staff?.documents?.[docId];
  if (!data) return;

  if (backendReady && (data.hasFile || data.url || data.filename)) {
    const url = data.url || `/api/files/${staffId}/${docId}`;
    if (tg.openLink) tg.openLink(url.startsWith("http") ? url : `${window.location.origin}${url}`);
    else window.open(url, "_blank");
    return;
  }
  tg.showAlert(`Hujjat: ${data.filename || docId}`);
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
  document.getElementById("input-photo").value = isRealPhoto(emp?.photo) ? emp.photo : "";
};

document.getElementById("form-cancel").onclick = () => {
  document.getElementById("employee-form").classList.add("hidden");
  if (editingEmployeeId) {
    showStaffDetail(editingEmployeeId);
  } else {
    document.getElementById("staff-list").classList.remove("hidden");
    tg.MainButton.show();
  }
};

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
    },
    photo: document.getElementById("input-photo").value.trim()
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
    replaceEmployee(data.employee);
    document.getElementById("employee-form").classList.add("hidden");
    showStaffDetail(data.employee.id);
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
    const list = await api("/api/employees");
    staffMembers = (list.employees || []).map(normalizeEmployee);
    return true;
  } catch {
    backendReady = false;
    return false;
  }
}

async function init() {
  document.getElementById("staff-cards").innerHTML = `<div class="empty-state">${t("loading")}</div>`;
  const ok = await loadFromBackend();
  if (!ok) {
    staffMembers = DEMO_STAFF.map(normalizeEmployee);
  }
  updateStatusBadge();
  setLang("uz");
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
