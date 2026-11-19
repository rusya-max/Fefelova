const MedicineStore = {
  get key() {
    const user = (typeof AuthStore !== "undefined") ? AuthStore.currentUser() : null;
    return user ? `medreminder_medicines_${user.id}` : "medreminder_medicines_guest";
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.key) || "[]"); }
    catch { return []; }
  },
  saveAll(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
  },
  add(data) {
    const items = this.getAll();
    const medicine = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...data, createdAt: new Date().toISOString() };
    items.push(medicine);
    this.saveAll(items);
    return medicine;
  },
  update(id, data) {
    const items = this.getAll().map(item => item.id === id ? { ...item, ...data } : item);
    this.saveAll(items);
  },
  remove(id) {
    this.saveAll(this.getAll().filter(item => item.id !== id));
  },
  find(id) {
    return this.getAll().find(item => item.id === id);
  }
};