// Подсчёт статистики за последние семь дней.
const Statistics = {
  getWeek() {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = Schedule.dateKey(date);
      const scheduled = Schedule.forDate(date);
      const records = HistoryStore.getAll().filter(x => x.dateKey === key);
      const taken = records.filter(x => x.status === "taken").length;
      const skipped = records.filter(x => x.status === "skipped").length;
      days.push({
        key,
        label: date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""),
        total: scheduled.length,
        taken,
        skipped
      });
    }
    return days;
  },
  render() {
    const days = this.getWeek();
    const total = days.reduce((sum, d) => sum + d.total, 0);
    const taken = days.reduce((sum, d) => sum + d.taken, 0);
    const skipped = days.reduce((sum, d) => sum + d.skipped, 0);
    const rate = total ? Math.round((taken / total) * 100) : 0;
    document.getElementById("weekTotal").textContent = total;
    document.getElementById("weekTaken").textContent = taken;
    document.getElementById("weekRate").textContent = `${rate}%`;

    const max = Math.max(1, ...days.map(d => d.taken + d.skipped));
    document.getElementById("weeklyChart").innerHTML = days.map(day => {
      const takenHeight = (day.taken / max) * 100;
      const skippedHeight = (day.skipped / max) * 100;
      return `<div class="chart-day" title="${day.label}: принято ${day.taken}, пропущено ${day.skipped}">
        <div class="bar-stack">
          <div class="bar-missed" style="height:${skippedHeight}%"></div>
          <div class="bar-taken" style="height:${takenHeight}%"></div>
        </div><small>${this.escape(day.label)}</small></div>`;
    }).join("");
  },
  escape(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  }
};
