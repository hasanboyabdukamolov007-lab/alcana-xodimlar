const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Theme
Object.keys(tg.themeParams).forEach(key => {
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
    required: "Majburiy",
    tests: "Test natijalari"
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
    required: "Обязательно",
    tests: "Результаты тестов"
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
    required: "Required",
    tests: "Test Results"
  }
};

let currentLang = "uz";
function t(key) { return i18n[currentLang][key] || key; }

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.getElementById("app-title").textContent = t("title");
  document.getElementById("search-input").placeholder = t("search");
  document.getElementById("back-btn").textContent = t("back");
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

// Sample staff
let staffMembers = [
  {
    id: 1,
    name: "Ali Karimov",
    position: { uz: "Dasturchi", ru: "Программист", en: "Software Engineer" },
    photo: "https://i.pravatar.cc/150?img=11",
    documents: {
      passport: { present: true, filename: "passport_ali.pdf", date: "2026-10-15" },
      photo_3x4: { present: true, filename: "photos_ali.zip", date: "2026-09-01" },
      contract: { present: true, filename: "contract_ali.pdf", date: "2026-08-20" },
      personality: { present: true, filename: "16p_ali.pdf", date: "2026-11-05" },
      iq_test: { present: false }
    }
  },
  {
    id: 2,
    name: "Malika Yusupova",
    position: { uz: "HR menejer", ru: "HR менеджер", en: "HR Manager" },
    photo: "https://i.pravatar.cc/150?img=5",
    documents: {
      passport: { present: true, filename: "passport_malika.pdf", date: "2026-11-01" },
      photo_3x4: { present: true, filename: "photo_malika.jpg", date: "2026-11-01" },
      contract: { present: false },
      personality: { present: true, filename: "16p_malika.pdf", date: "2026-10-28" },
      iq_test: { present: true, filename: "mensa_malika.pdf", date: "2026-10-30" }
    }
  },
  {
    id: 3,
    name: "Jasur Abdullaev",
    position: { uz: "Buxgalter", ru: "Бухгалтер", en: "Accountant" },
    photo: "https://i.pravatar.cc/150?img=12",
    documents: {
      passport: { present: false },
      photo_3x4: { present: true, filename: "photo_jasur.jpg", date: "2026-09-15" },
      personality: { present: false },
      iq_test: { present: false }
    }
  }
];

function calculateProgress(staff) {
  const total = REQUIRED_DOCS.length;
  const completed = REQUIRED_DOCS.filter(doc => staff.documents[doc.id]?.present).length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}

function renderStaffList() {
  const query = (document.getElementById("search-input").value || "").toLowerCase();
  const container = document.getElementById("staff-cards");
  container.innerHTML = "";

  staffMembers
    .filter(s => s.name.toLowerCase().includes(query))
    .forEach(staff => {
      const p = calculateProgress(staff);
      const complete = p.percent === 100;
      const card = document.createElement("div");
      card.className = "staff-card";
      card.onclick = () => showStaffDetail(staff.id);
      card.innerHTML = `
        <img class="avatar" src="${staff.photo}" alt="">
        <div class="staff-info">
          <div class="staff-name">${staff.name}</div>
          <div style="font-size:0.82rem;color:var(--tg-theme-hint-color)">${staff.position[currentLang]}</div>
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

function showStaffDetail(id) {
  window.currentStaffId = id;
  const staff = staffMembers.find(s => s.id === id);
  if (!staff) return;

  document.getElementById("staff-list").classList.add("hidden");
  document.getElementById("staff-detail").classList.remove("hidden");

  const p = calculateProgress(staff);
  let html = `
    <div style="text-align:center;margin-bottom:16px;">
      <img class="avatar" src="${staff.photo}" style="width:80px;height:80px;">
      <h2 style="margin:8px 0 4px;">${staff.name}</h2>
      <div style="color:var(--tg-theme-hint-color)">${staff.position[currentLang]}</div>
      <div style="margin-top:8px;font-weight:600;">${p.completed}/${p.total} ${t("verified")}</div>
    </div>
    <h3 style="margin-bottom:8px;">${t("documents")}</h3>
  `;

  REQUIRED_DOCS.forEach(doc => {
    const data = staff.documents[doc.id] || { present: false };
    const checked = data.present;
    html += `
      <div class="doc-item">
        <div class="checkbox ${checked ? "checked" : ""}" onclick="toggleDoc(${id}, '${doc.id}')">${checked ? "✓" : ""}</div>
        <div class="doc-content">
          <div class="doc-name">${doc.names[currentLang]}</div>
          <div class="doc-desc">${doc.desc[currentLang]}</div>
          <div class="file-info">${data.filename ? `📄 ${data.filename} • ${data.date || ""}` : t("noFile")}</div>
        </div>
        <div class="actions">
          ${checked && data.filename
            ? `<button class="view-btn" onclick="viewDoc('${data.filename}')">${t("view")}</button>`
            : `<button class="upload-btn" onclick="uploadDoc(${id}, '${doc.id}')">${t("upload")}</button>`}
        </div>
      </div>
    `;
  });

  document.getElementById("detail-content").innerHTML = html;
}

document.getElementById("back-btn").onclick = () => {
  document.getElementById("staff-detail").classList.add("hidden");
  document.getElementById("staff-list").classList.remove("hidden");
  renderStaffList();
};

document.getElementById("search-input").oninput = renderStaffList;

window.toggleDoc = function(staffId, docId) {
  const staff = staffMembers.find(s => s.id === staffId);
  if (!staff.documents[docId]) staff.documents[docId] = { present: false };
  staff.documents[docId].present = !staff.documents[docId].present;
  if (!staff.documents[docId].present) {
    delete staff.documents[docId].filename;
    delete staff.documents[docId].date;
  }
  showStaffDetail(staffId);
  tg.HapticFeedback.impactOccurred("light");
};

window.uploadDoc = function(staffId, docId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const staff = staffMembers.find(s => s.id === staffId);
    staff.documents[docId] = {
      present: true,
      filename: file.name,
      date: new Date().toISOString().split("T")[0]
    };
    showStaffDetail(staffId);
    tg.showAlert(`Yuklandi: ${file.name}`);
  };
  input.click();
};

window.viewDoc = function(filename) {
  tg.showAlert(`Hujjat: ${filename}\n\nHaqiqiy ilovada bu yerda ochiladi yoki yuklab olinadi.`);
};

// User info
const user = tg.initDataUnsafe?.user;
document.getElementById("user-info").textContent = user
  ? `${user.first_name} ${user.last_name || ""}`
  : "Demo rejim";

// Init
setLang("uz");
renderStaffList();

tg.MainButton.setText("Yangi xodim qo'shish");
tg.MainButton.show();
tg.MainButton.onClick(() => tg.showAlert("Yangi xodim qo'shish formasi ochiladi (backend kerak)"));