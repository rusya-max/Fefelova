// Главный файл: навигация, формы, отображение экранов и напоминания.
const App = {
  reminderTimer: null,
  toastTimer: null,
  calendarCursor: new Date(),

  init() {
    this.initAuth();
    this.bindNavigation();
    this.bindModal();
    this.bindForm();
    this.bindActions();
    this.renderAll();
    this.updateDate();
    this.startReminderCheck();
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("service-worker.js").catch(err => console.warn("Service Worker:", err));
    }
  },

  initAuth() {
    const user = AuthStore.currentUser();
    const modal = document.getElementById("authModal");
    const form = document.getElementById("authForm");
    const err = document.getElementById("authError");
    const loginBtn = form.querySelector('button[type="submit"]');
    const registerBtn = document.getElementById("authRegisterBtn");

    if (user) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      this.updateProfileUI(user);
      return;
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    loginBtn.onclick = (e) => {
      e.preventDefault();
      err.style.display = "none";
      const name = document.getElementById("authName").value.trim();
      const pin = document.getElementById("authPin").value.trim();
      if (!name || !pin) return;
      
      const logged = AuthStore.login(name, pin);
      if (logged) {
        this.initAuth();
        this.renderAll();
      } else {
        err.textContent = "Неверное имя или PIN-код.";
        err.style.display = "block";
      }
    };

    registerBtn.onclick = (e) => {
      e.preventDefault();
      err.style.display = "none";
      const name = document.getElementById("authName").value.trim();
      const pin = document.getElementById("authPin").value.trim();
      if (!name || pin.length !== 4) {
        err.textContent = "Введите имя и 4-значный PIN.";
        err.style.display = "block";
        return;
      }
      
      const result = AuthStore.register(name, pin);
      if (result.error) {
        err.textContent = result.error;
        err.style.display = "block";
      } else {
        this.initAuth();
        this.renderAll();
      }
    };
  },

  updateProfileUI(user) {
    const initial = user.name.charAt(0).toUpperCase();
    const topAvatar = document.getElementById("userAvatar");
    if (topAvatar) {
      if (user.avatar) {
        topAvatar.style.backgroundImage = `url(${user.avatar})`;
        topAvatar.textContent = "";
      } else {
        topAvatar.style.backgroundImage = "none";
        topAvatar.textContent = initial;
      }
    }

    const bigAvatar = document.getElementById("profilePageAvatar");
    if (bigAvatar) {
      if (user.avatar) {
        bigAvatar.style.backgroundImage = `url(${user.avatar})`;
        bigAvatar.textContent = "";
      } else {
        bigAvatar.style.backgroundImage = "none";
        bigAvatar.textContent = initial;
      }
    }

    const nameEl = document.getElementById("profilePageName");
    if (nameEl) nameEl.textContent = user.name;
    
    const inputName = document.getElementById("profileInputName");
    if (inputName) inputName.value = user.name;
  },

  bindNavigation() {
    document.getElementById("profileBtn").addEventListener("click", () => this.showPage("profile"));
    document.querySelectorAll(".nav-link").forEach(button => {
      button.addEventListener("click", () => this.showPage(button.dataset.page));
    });
    document.getElementById("mobileMenu").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
  },

  showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");
    document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.page === page));
    const titles = { dashboard: "Главная", medicines: "Мои лекарства", history: "История приёма", statistics: "Статистика", profile: "Профиль" };
    document.getElementById("topbarHeading").textContent = titles[page] || "MedReminder";
    document.getElementById("sidebar").classList.remove("open");
    this.renderAll();
  },

  bindModal() {
    ["addMedicine", "quickAdd"].forEach(id => document.getElementById(id).addEventListener("click", () => this.openModal()));
    ["closeModal", "cancelModal"].forEach(id => document.getElementById(id).addEventListener("click", () => this.closeModal()));
    document.getElementById("medicineModal").addEventListener("click", e => {
      if (e.target.id === "medicineModal") this.closeModal();
    });
    document.getElementById("medicineFrequency").addEventListener("change", () => this.syncCustomFrequencyField());
    document.getElementById("medicineFormType").addEventListener("change", () => this.syncCustomFormField());
    document.getElementById("dosePopup").addEventListener("click", e => {
      if (e.target.id === "dosePopup") this.hideDosePopup();
    });
    document.getElementById("closeCalendarModal").addEventListener("click", () => this.closeCalendarModal());
    document.getElementById("calendarModal").addEventListener("click", e => {
      if (e.target.id === "calendarModal") this.closeCalendarModal();
    });
  },

  syncCustomFrequencyField() {
    const freqSelect = document.getElementById("medicineFrequency");
    const wrap = document.getElementById("customFrequencyWrap");
    const input = document.getElementById("medicineCustomFrequency");
    const isCustom = freqSelect.value === "custom";
    wrap.style.display = isCustom ? "" : "none";
    input.required = isCustom;
    if (!isCustom) input.value = "";
  },

  syncCustomFormField() {
    const select = document.getElementById("medicineFormType");
    const wrap = document.getElementById("customFormWrap");
    const input = document.getElementById("medicineCustomForm");
    const isCustom = select.value === "Другое";
    wrap.style.display = isCustom ? "" : "none";
    input.required = isCustom;
    if (!isCustom) input.value = "";
  },

  openModal(medicine = null) {
    const form = document.getElementById("medicineForm");
    form.reset();
    document.getElementById("medicineId").value = medicine?.id || "";
    document.getElementById("modalTitle").textContent = medicine ? "Изменить лекарство" : "Добавить лекарство";
    document.getElementById("medicineName").value = medicine?.name || "";
    const formType = medicine?.form || "Таблетка";
    document.getElementById("medicineFormType").value = formType === "Другое" ? "Другое" : formType;
    document.getElementById("medicineCustomForm").value = medicine?.customForm || "";
    document.getElementById("medicineDose").value = medicine?.dose || "";
    document.getElementById("medicineTime").value = medicine?.time || "09:00";
    document.getElementById("medicineFrequency").value = medicine?.frequency || "daily";
    document.getElementById("medicineCustomFrequency").value = medicine?.customFrequency || "";
    this.syncCustomFormField();
    this.syncCustomFrequencyField();
    document.getElementById("medicineModal").classList.add("open");
    document.getElementById("medicineModal").setAttribute("aria-hidden", "false");
    document.getElementById("medicineName").focus();
  },

  closeModal() {
    document.getElementById("medicineModal").classList.remove("open");
    document.getElementById("medicineModal").setAttribute("aria-hidden", "true");
  },

  bindForm() {
    document.getElementById("medicineForm").addEventListener("submit", e => {
      e.preventDefault();
      
      const id = document.getElementById("medicineId").value;
      const frequency = document.getElementById("medicineFrequency").value;
      const customFrequency = document.getElementById("medicineCustomFrequency").value.trim();
      const formSelect = document.getElementById("medicineFormType").value;
      const customForm = document.getElementById("medicineCustomForm").value.trim();

      const data = {
        name: document.getElementById("medicineName").value.trim(),
        form: formSelect,
        customForm: formSelect === "Другое" ? customForm : "",
        dose: document.getElementById("medicineDose").value.trim(),
        time: document.getElementById("medicineTime").value,
        frequency,
        customFrequency: frequency === "custom" ? customFrequency : ""
      };

      if (!data.name || !data.dose || !data.time) return this.toast("Заполните все обязательные поля.");
      if (formSelect === "Другое" && !customForm) return this.toast("Укажите свою форму лекарства.");
      if (frequency === "custom" && !customFrequency) return this.toast("Опишите свой вариант периодичности.");

      if (id) {
        MedicineStore.update(id, data);
        this.toast("Данные лекарства обновлены.");
      } else {
        MedicineStore.add(data);
        this.toast("Лекарство добавлено в расписание.");
      }
      this.closeModal();
      this.renderAll();
    });
  },

  bindActions() {
    // Сохранение профиля
    document.getElementById("profileForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const newName = document.getElementById("profileInputName").value.trim();
      const newPin = document.getElementById("profileInputPin").value.trim();
      
      if (!newName) return this.toast("Имя не может быть пустым.");
      if (newPin && newPin.length !== 4) return this.toast("PIN должен содержать 4 цифры.");

      const result = AuthStore.updateProfile({ name: newName, pin: newPin || undefined });
      if (result && result.error) return this.toast(result.error);
      
      this.toast("Профиль обновлён.");
      this.updateProfileUI(AuthStore.currentUser());
      document.getElementById("profileInputPin").value = "";
    });

    // Загрузка аватара
    document.getElementById("avatarInput").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        AuthStore.updateProfile({ avatar: event.target.result });
        this.updateProfileUI(AuthStore.currentUser());
        this.toast("Фото обновлено.");
      };
      reader.readAsDataURL(file);
    });

    // Выход
    document.getElementById("logoutPageBtn").addEventListener("click", () => {
      if (confirm("Выйти из аккаунта?")) {
        AuthStore.logout();
        location.reload();
      }
    });

    // Редактирование и удаление лекарства
    document.getElementById("medicineList").addEventListener("click", e => {
      const edit = e.target.closest("[data-edit]");
      const remove = e.target.closest("[data-delete]");
      if (edit) this.openModal(MedicineStore.find(edit.dataset.edit));
      if (remove) {
        const medicine = MedicineStore.find(remove.dataset.delete);
        if (medicine && confirm(`Удалить «${medicine.name}»?`)) {
          MedicineStore.remove(medicine.id);
          this.toast("Лекарство удалено.");
          this.renderAll();
        }
      }
    });

    // Отметка "Принято" / "Пропустить" в расписании
    document.getElementById("todaySchedule").addEventListener("click", e => {
      const action = e.target.closest("[data-status]");
      if (!action) return;
      const medicine = MedicineStore.find(action.dataset.medicine);
      if (!medicine) return;
      HistoryStore.setStatus(medicine, Schedule.dateKey(), action.dataset.status);
      this.toast(action.dataset.status === "taken" ? "Приём отмечен как выполненный." : "Приём отмечен как пропущенный.");
      this.renderAll();
    });

    // Ближайший приём
    document.getElementById("nextDose").addEventListener("click", e => {
      const btn = e.target.closest("[data-status]");
      if (!btn) return;
      const medicine = MedicineStore.find(btn.dataset.medicine);
      if (!medicine) return;
      HistoryStore.setStatus(medicine, Schedule.dateKey(), btn.dataset.status);
      this.toast("Приём отмечен как выполненный.");
      this.renderAll();
    });

    // Очистка истории
    document.getElementById("clearHistory").addEventListener("click", () => {
      if (confirm("Удалить все записи истории?")) {
        HistoryStore.clear();
        this.toast("История очищена.");
        this.renderAll();
      }
    });

    // Календарь
    document.getElementById("calPrev").addEventListener("click", () => this.shiftCalendarMonth(-1));
    document.getElementById("calNext").addEventListener("click", () => this.shiftCalendarMonth(1));

    document.getElementById("calendarModalContent").addEventListener("click", e => {
      const btn = e.target.closest("[data-status]");
      if (!btn) return;
      const medicine = MedicineStore.find(btn.dataset.medicine);
      if (!medicine) return;
      
      HistoryStore.setStatus(medicine, btn.dataset.date, btn.dataset.status);
      this.toast(btn.dataset.status === "taken" ? "Приём отмечен как выполненный." : "Приём отмечен как пропущенный.");
      this.renderAll();
      this.openCalendarDay(btn.dataset.date); 
    });
  },

  renderAll() {
    this.renderDashboard();
    this.renderMedicines();
    this.renderHistory();
    this.renderCalendar();
    Statistics.render();
  },

  updateDate() {
    const now = new Date();
    document.getElementById("todayDate").textContent = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
    document.getElementById("todayPill").textContent = now.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  },

  formIcon(medicine) {
    const form = (medicine?.form || "").toLowerCase();
    const custom = (medicine?.customForm || "").toLowerCase();
    const src = form + " " + custom;

    let cls = "other", file = "other.png";
    if (/таблет|pill/.test(src))            { cls = "pill";    file = "pill.png"; }
    else if (/капсул|capsul/.test(src))     { cls = "capsule"; file = "capsule.png"; }
    else if (/сироп|syrup|sirup/.test(src)) { cls = "syrup";   file = "syrup.png"; }
    else if (/капл|drop/.test(src))         { cls = "drops";   file = "drops.png"; }

    return `<div class="form-icon ${cls}" aria-hidden="true"><img src="icons/${file}" alt=""></div>`;
  },

  formIconClass(medicine) {
    const form = (medicine?.form || "").toLowerCase();
    const custom = (medicine?.customForm || "").toLowerCase();
    const src = form + " " + custom;
    if (/таблет|pill/.test(src)) return "is-pill";
    if (/капсул|capsul/.test(src)) return "is-capsule";
    if (/сироп|syrup|sirup/.test(src)) return "is-syrup";
    if (/капл|drop/.test(src)) return "is-drops";
    return "is-other";
  },

  renderDashboard() {
    const doses = Schedule.forDate();
    const taken = doses.filter(x => x.status === "taken").length;
    const pending = doses.filter(x => x.status === "pending").length;
    document.getElementById("todayTotal").textContent = doses.length;
    document.getElementById("todayTaken").textContent = taken;
    document.getElementById("todayPending").textContent = pending;

    const list = document.getElementById("todaySchedule");
    if (!doses.length) {
      list.innerHTML = `<div class="empty-state" style="text-align:center;padding:30px;"><div class="empty-icon" style="margin:0 auto 12px;">＋</div><strong>Расписание пока пустое</strong><br>Добавьте первое лекарство.</div>`;
    } else {
      list.innerHTML = doses.map(m => {
        const status = m.status;
        const statusText = status === "taken" ? "Принято" : status === "skipped" ? "Пропущено" : "Ожидает";
        const actions = status === "pending"
          ? `<div class="dose-actions"><button class="small-action take-button" data-medicine="${m.id}" data-status="taken">✓</button><button class="small-action skip-button" data-medicine="${m.id}" data-status="skipped">✕</button></div>`
          : `<span class="status-label ${status === "taken" ? "status-taken" : "status-skipped"}">${statusText}</span>`;
        const formLabel = `${this.escape(m.form)}${m.customForm ? " · " + this.escape(m.customForm) : ""}`;
        
        return `<article class="dose-card status-${status}">
          <span class="dose-time">${this.escape(m.time)}</span>
          <div class="dose-status-circle"></div>
          ${this.formIcon(m)}
          <div class="dose-info"><strong>${this.escape(m.name)}</strong><small>${this.escape(m.dose)} · ${formLabel}</small></div>
          ${actions}
        </article>`;
      }).join("");
    }

    const next = doses.find(x => x.status === "pending");
    const nextBox = document.getElementById("nextDose");
    if (!next) {
      nextBox.innerHTML = `<div class="empty-icon">✓</div><strong>${doses.length ? "Все приёмы отмечены" : "Пока нет приёмов"}</strong><p class="muted">${doses.length ? "На сегодня больше нет ожидающих приёмов." : "Добавьте лекарство и настройте расписание."}</p>`;
    } else {
      nextBox.innerHTML = `<div class="empty-icon">◷</div><span class="muted" style="color:var(--mint-dark);font-weight:800;">Следующее лекарство</span><div class="next-time">${this.escape(next.time)}</div><strong>${this.escape(next.name)}</strong><p class="muted">${this.escape(next.dose)}</p><button type="button" class="next-take" data-medicine="${next.id}" data-status="taken">Принято</button>`;
    }
  },

  renderMedicines() {
    const items = MedicineStore.getAll();
    const list = document.getElementById("medicineList");
    if (!items.length) {
      list.innerHTML = `<div class="panel empty-state" style="grid-column:1/-1;text-align:center;"><div class="empty-icon" style="margin:0 auto 12px;">✚</div><strong>Список лекарств пуст</strong><br>Нажмите «Добавить лекарство».</div>`;
      return;
    }
    list.innerHTML = items.map(m => {
      const formLabel = `${this.escape(m.form)}${m.customForm ? " · " + this.escape(m.customForm) : ""}`;
      const formCls = this.formIconClass(m);
      return `<article class="medicine-card ${formCls}">
        <div class="medicine-card-top">${this.formIcon(m)}<div><strong>${this.escape(m.name)}</strong><small>${formLabel} · ${this.escape(m.dose)}</small></div></div>
        <div class="medicine-meta"><span class="meta-chip">◷ ${this.escape(m.time)}</span><span class="meta-chip">${this.escape(Schedule.frequencyLabel(m))}</span></div>
        <div class="card-actions"><button class="text-button" data-edit="${m.id}">Изменить</button><button class="text-button danger-text" data-delete="${m.id}">Удалить</button></div>
      </article>`;
    }).join("");
  },

  renderHistory() {
    this.renderCalendar();
    const records = HistoryStore.getAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const list = document.getElementById("historyList");
    if (!records.length) {
      list.innerHTML = `<div class="empty-state" style="text-align:center;padding:20px;"><div class="empty-icon" style="margin:0 auto 12px;">◷</div><strong>История пока пуста</strong></div>`;
      return;
    }
    const medicines = MedicineStore.getAll();
    list.innerHTML = records.map(r => {
      const date = new Date(`${r.dateKey}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
      const status = r.status === "taken" ? "Принято" : "Пропущено";
      const med = medicines.find(m => m.id === r.medicineId) || { name: r.medicineName, form: "", dose: r.dose, customForm: "" };
      return `<div class="history-row">${this.formIcon(med)}<div class="history-main"><strong>${this.escape(r.medicineName)}</strong><small>${this.escape(r.dose)} · ${this.escape(r.time)}</small></div><span class="history-date">${date}</span><span class="status-label ${r.status === "taken" ? "status-taken" : "status-skipped"}">${status}</span></div>`;
    }).join("");
  },

  startReminderCheck() {
    const NOTIFIED_KEY = "medreminder_notified_v1";
    const readNotified = () => { try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}"); } catch { return {}; } };
    const writeNotified = map => { try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(map)); } catch {} };

    const check = () => {
      if (!AuthStore.currentUser()) return;
      const now = new Date();
      const today = Schedule.dateKey(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const notified = readNotified();
      let changed = false;

      Schedule.forDate(now).forEach(m => {
        if (m.status !== "pending" || !m.time) return;
        const [h, min] = m.time.split(":").map(Number);
        const medMinutes = h * 60 + min;
        if (Math.abs(nowMinutes - medMinutes) > 1) return;

        const key = `${m.id}_${today}_${m.time}`;
        if (notified[key]) return;

        this.showDosePopup(m);
        notified[key] = Date.now();
        changed = true;
      });

      if (changed) {
        const cutoff = Date.now() - 3 * 86400000;
        Object.keys(notified).forEach(k => { if (notified[k] < cutoff) delete notified[k]; });
        writeNotified(notified);
      }
    };

    check();
    this.reminderTimer = setInterval(check, 30000);
  },

  showDosePopup(medicine) {
    const popup = document.getElementById("dosePopup");
    if (!popup) return;
    document.getElementById("dosePopupName").textContent = medicine.name;
    const formLabel = `${medicine.form || ""}${medicine.customForm ? " · " + medicine.customForm : ""}`;
    document.getElementById("dosePopupDose").textContent = `${formLabel} — ${medicine.dose || ""}`.trim();
    document.getElementById("dosePopupTime").textContent = medicine.time;

    const iconWrap = document.getElementById("dosePopupIcon");
    if (iconWrap) iconWrap.innerHTML = this.formIcon(medicine);

    const takeBtn = document.getElementById("dosePopupTake");
    const skipBtn = document.getElementById("dosePopupSkip");

    const newTake = takeBtn.cloneNode(true);
    const newSkip = skipBtn.cloneNode(true);
    takeBtn.replaceWith(newTake);
    skipBtn.replaceWith(newSkip);

    newTake.addEventListener("click", () => {
      HistoryStore.setStatus(medicine, Schedule.dateKey(), "taken");
      this.hideDosePopup();
      this.toast("Приём отмечен как выполненный.");
      this.renderAll();
    });
    newSkip.addEventListener("click", () => {
      HistoryStore.setStatus(medicine, Schedule.dateKey(), "skipped");
      this.hideDosePopup();
      this.toast("Приём отмечен как пропущенный.");
      this.renderAll();
    });

    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
  },

  hideDosePopup() {
    const popup = document.getElementById("dosePopup");
    if (!popup) return;
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
  },

  shiftCalendarMonth(delta) {
    this.calendarCursor = new Date(this.calendarCursor.getFullYear(), this.calendarCursor.getMonth() + delta, 1);
    this.renderCalendar();
  },

  renderCalendar() {
    const cursor = this.calendarCursor;
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = Schedule.dateKey();
    const history = HistoryStore.getAll();

    document.getElementById("calTitle").textContent = cursor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

    const dows = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join("");

    for (let i = 0; i < startDow; i++) html += `<div class="cal-day other"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const dayRecords = history.filter(x => x.dateKey === key);
      const hasTaken = dayRecords.some(x => x.status === "taken");
      const hasSkipped = dayRecords.some(x => x.status === "skipped");
      let cls = "cal-day";
      if (hasTaken && hasSkipped) cls += " has-both";
      else if (hasTaken) cls += " has-taken";
      else if (hasSkipped) cls += " has-skipped";
      if (key === todayKey) cls += " today";
      const dots = (hasTaken ? `<span class="cal-dot taken"></span>` : "") + (hasSkipped ? `<span class="cal-dot skipped"></span>` : "");
      html += `<div class="${cls}" data-date="${key}" title="Нажмите, чтобы посмотреть приёмы">${d}<div class="cal-dots">${dots}</div></div>`;
    }

    document.getElementById("calGrid").innerHTML = html;

    document.getElementById("calGrid").onclick = (e) => {
      const dayEl = e.target.closest(".cal-day:not(.other)");
      if (dayEl && dayEl.dataset.date) {
        this.openCalendarDay(dayEl.dataset.date);
      }
    };
  },

  openCalendarDay(dateKey) {
    const modal = document.getElementById("calendarModal");
    const content = document.getElementById("calendarModalContent");
    const title = document.getElementById("calendarModalTitle");
    
    const dateObj = new Date(`${dateKey}T00:00:00`);
    title.textContent = dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

    const allMedicines = MedicineStore.getAll();
    const doses = allMedicines
      .filter(m => Schedule.isScheduled(m, dateObj))
      .map(m => ({
        ...m,
        status: HistoryStore.getStatus(m.id, dateKey)
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
    
    if (!doses.length) {
      content.innerHTML = `<div class="cal-modal-empty">На этот день нет запланированных лекарств.</div>`;
    } else {
      content.innerHTML = `<div class="cal-modal-list">${doses.map(m => {
        const status = m.status;
        const isTaken = status === "taken";
        const isSkipped = status === "skipped";
        
        let actionsHtml = "";
        if (status === "pending") {
          actionsHtml = `<button data-medicine="${m.id}" data-date="${dateKey}" data-status="taken" class="take">Принято</button>
                         <button data-medicine="${m.id}" data-date="${dateKey}" data-status="skipped" class="skip">✕</button>`;
        } else {
          actionsHtml = `<span class="status-label ${isTaken ? "status-taken" : "status-skipped"}">${isTaken ? "Принято" : "Пропущено"}</span>`;
        }

        return `<div class="cal-modal-item">
          ${this.formIcon(m)}
          <div class="cal-modal-info">
            <strong>${this.escape(m.name)}</strong>
            <small>${this.escape(m.time)} · ${this.escape(m.dose)}</small>
          </div>
          <div class="cal-modal-actions">${actionsHtml}</div>
        </div>`;
      }).join("")}</div>`;
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  },

  closeCalendarModal() {
    const modal = document.getElementById("calendarModal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  },

  toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  },

  escape(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  }
};
document.addEventListener("DOMContentLoaded", () => App.init());