// Журнал статусов приёма.
const HistoryStore = {
  get key() {
    const user = AuthStore.currentUser();
    return user ? `medreminder_history_${user.id}` : "medreminder_history_guest";
  },
  
  saveAll(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  },
  getStatus(medicineId, dateKey) {
    const record = this.getAll().find(x => x.medicineId === medicineId && x.dateKey === dateKey);
    return record ? record.status : "pending";
  },
  setStatus(medicine, dateKey, status) {
    const items = this.getAll().filter(x => !(x.medicineId === medicine.id && x.dateKey === dateKey));
    items.push({
      id: `${medicine.id}_${dateKey}`,
      medicineId: medicine.id,
      medicineName: medicine.name,
      dose: medicine.dose,
      time: medicine.time,
      dateKey,
      status,
      updatedAt: new Date().toISOString()
    });
    this.saveAll(items);
  },
  clear() {
    this.saveAll([]);
  }
};
