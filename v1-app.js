'use strict';

// A buildless prototype. All interactions stay in the browser; there is no lead submission.
const header = document.querySelector('#header');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  header.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
}
menuToggle.addEventListener('click', () => {
  const open = !header.classList.contains('menu-open');
  header.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', e => { if (!header.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
let scrollQueued = false;
function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 70);
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { requestAnimationFrame(updateHeader); scrollQueued = true; }
}, { passive: true });
updateHeader();
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

function setUpTabs(selector, afterChange) {
  const list = document.querySelector(selector);
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  function select(tab, shouldFocus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    if (shouldFocus) tab.focus({ preventScroll: true });
    if (afterChange) afterChange(tab);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const vertical = list.getAttribute('aria-orientation') === 'vertical';
      let next = null;
      if (e.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (index + 1) % tabs.length;
      if (e.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (index - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); select(tabs[next], true); }
    });
  });
}
setUpTabs('.space-tabs');
setUpTabs('.role-tabs');

const contactDialog = document.querySelector('#contact-dialog');
const galleryDialog = document.querySelector('#gallery-dialog');
const interestDescription = document.querySelector('#interest-description');
const copyStatus = document.querySelector('#copy-status');
const copyButton = document.querySelector('#copy-inquiry');
const interests = {
  guest: {
    description: 'Расскажите, каким вы представляете отдых в «Элиосе». Центр пока находится на стадии разработки.',
    message: 'Александр, здравствуйте! Познакомился с концепцией «Элиоса». Мне интересен отдых в будущем центре. Хотел бы узнать о развитии проекта и поделиться пожеланиями.'
  },
  partner: {
    description: 'Обсудим развитие центра: возможный масштаб участия, этапы вложений и роль в принятии решений.',
    message: 'Александр, здравствуйте! Познакомился с концепцией «Элиоса». Рассматриваю участие в развитии центра как инвестор-партнёр. Хотел бы обсудить формат, этапы и условия партнёрства.'
  },
  home: {
    description: 'Обсудим дом для проживания, отдыха или как инвестицию. Формат приобретения и управления ещё разрабатывается.',
    message: 'Александр, здравствуйте! Познакомился с концепцией «Элиоса». Меня интересует дом на территории центра. Хотел бы узнать о разрабатываемом формате приобретения, правах и управлении.'
  },
  business: {
    description: 'Расскажите об опыте и идее своего дела: кафе, баня, спа или другое направление для гостей центра.',
    message: 'Александр, здравствуйте! Познакомился с концепцией «Элиоса». Хотел бы обсудить создание объекта инфраструктуры и участие в работе центра как предприниматель.'
  }
};
let currentInterest = 'guest';
let returnFocus = null;
function clearCopyState() {
  copyStatus.textContent = '';
  copyButton.textContent = 'Скопировать текст обращения';
  contactDialog.querySelector('.copy-fallback')?.remove();
}
function chooseInterest(value) {
  currentInterest = Object.hasOwn(interests, value) ? value : 'guest';
  const input = contactDialog.querySelector(`input[value="${currentInterest}"]`);
  input.checked = true;
  interestDescription.textContent = interests[currentInterest].description;
  clearCopyState();
}
function openDialog(dialog, trigger) {
  returnFocus = trigger || document.activeElement;
  document.body.classList.add('modal-open');
  dialog.showModal();
}
function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}
document.querySelectorAll('[data-contact]').forEach(button => {
  button.addEventListener('click', () => {
    closeMenu();
    chooseInterest(button.dataset.interest || 'guest');
    openDialog(contactDialog, button);
  });
});
contactDialog.querySelectorAll('input[name="interest"]').forEach(input => {
  input.addEventListener('change', () => chooseInterest(input.value));
});
copyButton.addEventListener('click', async () => {
  const message = interests[currentInterest].message;
  clearCopyState();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(message);
    copyButton.textContent = 'Текст скопирован';
    copyStatus.textContent = 'Вставьте его в переписку с Александром. Сообщение не отправлено автоматически.';
  } catch {
    const field = document.createElement('textarea');
    field.className = 'copy-fallback';
    field.value = message;
    field.readOnly = true;
    field.setAttribute('aria-label', 'Текст обращения для копирования');
    copyButton.after(field);
    field.focus();
    field.select();
    copyStatus.textContent = 'Выделите и скопируйте этот текст для переписки с Александром.';
  }
});

const galleries = {
  concepts: [
    { key: 'home', file: 'home', caption: 'Личное пространство. Визуализация концепции будущего центра.' },
    { key: 'cafe', file: 'cafe', caption: 'Место для встреч. Визуализация концепции будущего центра.' },
    { key: 'bath', file: 'bath', caption: 'Тишина и тепло. Визуализация концепции будущего центра.' }
  ],
  coast: [
    { key: 'coast', file: 'coast', caption: 'Побережье. Фотография из исходных материалов «Элиоса».' },
    { key: 'land', file: 'land', caption: 'Открытый ландшафт. Фотография из исходных материалов «Элиоса».' },
    { key: 'shore', file: 'shore', caption: 'Береговая линия. Фотография из исходных материалов «Элиоса».' },
    { key: 'waves', file: 'waves', caption: 'У моря. Фотография из исходных материалов «Элиоса».' }
  ]
};
let galleryGroup = galleries.coast;
let galleryIndex = 0;
const galleryImage = document.querySelector('#gallery-image');
const galleryCaption = document.querySelector('#gallery-caption');
const galleryCount = document.querySelector('#gallery-count');
function showGalleryImage(index) {
  galleryIndex = (index + galleryGroup.length) % galleryGroup.length;
  const item = galleryGroup[galleryIndex];
  galleryImage.src = `assets/${item.file}.webp`;
  galleryImage.alt = item.caption;
  galleryCaption.textContent = item.caption;
  galleryCount.textContent = `${galleryIndex + 1} / ${galleryGroup.length}`;
}
document.querySelectorAll('[data-gallery]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.gallery;
    galleryGroup = Object.values(galleries).find(group => group.some(item => item.key === key));
    if (!galleryGroup) return;
    showGalleryImage(galleryGroup.findIndex(item => item.key === key));
    openDialog(galleryDialog, button);
  });
});
galleryDialog.querySelector('.gallery-previous').addEventListener('click', () => showGalleryImage(galleryIndex - 1));
galleryDialog.querySelector('.gallery-next').addEventListener('click', () => showGalleryImage(galleryIndex + 1));
galleryDialog.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); showGalleryImage(galleryIndex - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showGalleryImage(galleryIndex + 1); }
});
[contactDialog, galleryDialog].forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) closeDialog(dialog);
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    returnFocus?.focus({ preventScroll: true });
  });
});
