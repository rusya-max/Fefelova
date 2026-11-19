const AuthStore = {
  key: "medreminder_users",
  sessionKey: "medreminder_current_user",

  updateProfile(data) {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index === -1) return;

    
    if (data.name && data.name.toLowerCase() !== users[index].name.toLowerCase()) {
      if (users.some(u => u.name.toLowerCase() === data.name.toLowerCase())) {
        return { error: "Это имя уже занято." };
      }
    }

    users[index] = { ...users[index], ...data };
    this.saveUsers(users);
    localStorage.setItem(this.sessionKey, JSON.stringify(users[index]));
    return users[index];
  },
  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.key) || "[]"); } catch { return []; }
  },
  saveUsers(users) {
    localStorage.setItem(this.key, JSON.stringify(users));
  },
  currentUser() {
    try { return JSON.parse(localStorage.getItem(this.sessionKey) || "null"); } catch { return null; }
  },
  login(name, pin) {
    const users = this.getUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.pin === pin);
    if (user) {
      localStorage.setItem(this.sessionKey, JSON.stringify(user));
      return user;
    }
    return null;
  },
  register(name, pin) {
    const users = this.getUsers();
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      return { error: "Пользователь с таким именем уже существует." };
    }
    const newUser = { id: Date.now().toString(36), name, pin };
    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem(this.sessionKey, JSON.stringify(newUser));
    return newUser;
  },
  logout() {
    localStorage.removeItem(this.sessionKey);
  }
};