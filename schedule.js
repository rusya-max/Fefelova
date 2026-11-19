// Формирование расписания на конкретную дату.
const Schedule = {
  dateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },
  isScheduled(medicine, date) {
    const added = new Date(medicine.createdAt);
    added.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    if (target < added) return false;
    const day = date.getDay(); // 0 — воскресенье, 6 — суббота
    if (medicine.frequency === "weekdays") return day >= 1 && day <= 5;
    if (medicine.frequency === "weekends") return day === 0 || day === 6;
    if (medicine.frequency === "alternate") {
      const start = new Date(medicine.createdAt);
      start.setHours(0, 0, 0, 0);
      const current = new Date(date);
      current.setHours(0, 0, 0, 0);
      const diff = Math.floor((current - start) / 86400000);
      return diff >= 0 && diff % 2 === 0;
    }
    // daily и custom — каждый день
    return true;
  },
  forDate(date = new Date()) {
    return MedicineStore.getAll()
      .filter(m => this.isScheduled(m, date))
      .map(m => ({ ...m, dateKey: this.dateKey(date), status: HistoryStore.getStatus(m.id, this.dateKey(date)) }))
      .sort((a, b) => a.time.localeCompare(b.time));
  },
  frequencyLabel(medicine) {
    if (typeof medicine === "string") medicine = { frequency: medicine };
    const freq = medicine?.frequency || "daily";
    if (freq === "custom") return medicine.customFrequency || "Свой вариант";
    return ({ daily: "Каждый день", weekdays: "По будням", weekends: "По выходным", alternate: "Через день" })[freq] || "Каждый день";
  }
};