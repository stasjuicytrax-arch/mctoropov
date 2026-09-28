// Цели Яндекс.Метрики на четыре целевых действия (ТЗ §1, §11):
//   telegram · lead (форма) · presentation · call
// Счётчик подключается позже (нужен доступ, ТЗ §9). Пока ym нет — цели пишутся в консоль в dev.
const COUNTER_ID = null;   // TODO: номер счётчика Метрики

export function reachGoal(name) {
  if (COUNTER_ID && typeof window.ym === 'function') window.ym(COUNTER_ID, 'reachGoal', name);
  else if (import.meta.env.DEV) console.info('[goal]', name);
}

export function initGoals() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goal]');
    if (el) reachGoal(el.dataset.goal);
  });
}
