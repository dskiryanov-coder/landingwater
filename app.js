import { systems, questions } from './content.js';
import { formsConfig } from './forms-config.js';

const money = new Intl.NumberFormat('ru-RU');
const grid = document.querySelector('#systems-grid');
for (const system of systems) {
  const card = document.createElement('article');
  card.className = 'system-card';
  card.id = `system-${system.id}`;
  card.innerHTML = `<div class="system-image"><img src="assets/equipment.svg#${system.image}" alt="Условная иллюстрация оборудования: ${system.name}" width="400" height="225" loading="lazy"><span class="system-index">${system.number} /</span><span class="system-tag">${system.tag}</span></div><div class="system-card-body"><h3>${system.name}</h3><p class="system-description">${system.description}</p><div class="system-bottom"><div><p class="price-label">Оборудование</p><p class="system-price"><small>от</small> ${money.format(system.price)} ₽</p></div><button class="button button-outline" data-form="${system.id}" aria-label="Уточнить у инженера: ${system.name}">Уточнить у инженера <span aria-hidden="true">↗</span></button></div></div>`;
  grid.append(card);
}

for (const [question, answer] of questions) {
  const detail = document.createElement('details');
  const summary = document.createElement('summary');
  const text = document.createElement('p');
  summary.textContent = question;
  text.textContent = answer;
  detail.append(summary, text);
  document.querySelector('#faq-list').append(detail);
}

let formSequence = 0;
const formCleanups = new WeakMap();
function renderForm(container, key) {
  formCleanups.get(container)?.();
  container.replaceChildren();
  const config = formsConfig[key];
  if (config) {
    // Официальный загрузчик Битрикс24 получает свой script-контекст для каждого размещения.
    // Не сообщаем об успехе сами: результат отправки отображает CRM-форма.
    const mount = document.createElement('div');
    const fallback = document.createElement('p');
    fallback.className = 'form-fallback';
    const direct = document.createElement('a');
    const url = new URL(config.url);
    const loaderUrl = new URL(config.loaderUrl);
    if (url.protocol !== 'https:' || loaderUrl.protocol !== 'https:') throw new Error('Bitrix24 form URLs must use HTTPS');
    direct.href = url.href;
    direct.target = '_blank';
    direct.rel = 'noopener noreferrer';
    direct.textContent = 'Открыть форму в отдельной вкладке';
    fallback.append('Если форма не отображается: ', direct);
    const script = document.createElement('script');
    script.dataset.b24Form = `inline/${config.id}/${config.code}`;
    script.dataset.skipMoving = 'true';
    script.src = loaderUrl.href;
    script.async = true;
    mount.append(script);
    container.append(mount, fallback);
    formCleanups.set(container, () => mount.remove());
    return;
  }
  const id = `demo-${++formSequence}`;
  container.innerHTML = `<p class="form-title">Начнём с вашей задачи</p><p class="form-subtitle">Подбор оборудования с инженером Аквадом</p><span class="demo-badge">Демонстрационная форма</span><form class="demo-form" aria-label="Демонстрационная форма консультации"><label for="${id}-name">Имя</label><input id="${id}-name" name="name" type="text" placeholder="Как к вам обращаться" autocomplete="off" aria-describedby="${id}-notice"><label for="${id}-phone">Телефон</label><input id="${id}-phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="off" aria-describedby="${id}-notice"><button class="button" type="submit" disabled>Отправка пока недоступна</button><p class="demo-notice" id="${id}-notice">Это предварительная версия сайта. Форма пока не принимает заявки: введённые данные не отправляются и не сохраняются.</p></form>`;
  container.querySelector('form').addEventListener('submit', event => event.preventDefault());
  // Не используем localStorage, cookies, аналитику или сетевые запросы для заглушек.
  formCleanups.delete(container);
}

for (const slot of document.querySelectorAll('[data-form-slot]')) renderForm(slot, slot.dataset.formSlot);

const dialog = document.querySelector('#consultation-dialog');
const dialogForm = document.querySelector('#dialog-form');
let opener;
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-form]');
  if (!trigger) return;
  const key = trigger.dataset.form;
  if (!Object.hasOwn(formsConfig, key)) return;
  opener = trigger;
  document.querySelector('#dialog-title').textContent = systems.find(system => system.id === key)?.name || 'Подбор системы для вашего дома';
  renderForm(dialogForm, key);
  closeMenu();
  dialog.showModal();
  document.body.classList.add('modal-open');
});
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], iframe, [tabindex="0"]')]
    .filter(element => element.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  formCleanups.get(dialogForm)?.();
  dialogForm.replaceChildren();
  opener?.focus({ preventScroll: true });
});

const menu = document.querySelector('#mobile-nav');
const menuToggle = document.querySelector('.menu-toggle');
function closeMenu() {
  menu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
}
menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menu.hidden = expanded;
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Открыть меню' : 'Закрыть меню');
});
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuToggle.focus(); } });
matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();
