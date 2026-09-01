document.addEventListener('DOMContentLoaded', () => {
  const brandMark = document.querySelector('.brand-mark');
  if (brandMark) {
    brandMark.innerHTML = '<span class="brand-dot"></span>';
  }

  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const parent = button.closest('.nav, .support');
      if (!parent) return;
      parent.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
    });
  });

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  const createBtn = document.querySelector('.create-btn');
  const sessionCount = document.querySelector('.session-count');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const nextCount = Number(sessionCount?.textContent?.match(/\d+/)?.[0] || 1) + 1;
      if (sessionCount) sessionCount.textContent = `${nextCount} Session${nextCount === 1 ? '' : 's'}`;
      const toast = document.createElement('div');
      toast.className = 'flash-toast';
      toast.textContent = 'New session created';
      document.querySelector('.main-panel')?.appendChild(toast);
      setTimeout(() => toast.remove(), 1400);
    });
  }

  document.querySelector('.upgrade-btn')?.addEventListener('click', () => {
    const toast = document.createElement('div');
    toast.className = 'flash-toast';
    toast.textContent = 'Upgrade flow is demo-only';
    document.querySelector('.main-panel')?.appendChild(toast);
    setTimeout(() => toast.remove(), 1400);
  });

  document.querySelector('.transcript-btn')?.addEventListener('click', () => {
    const toast = document.createElement('div');
    toast.className = 'flash-toast';
    toast.textContent = 'Transcript opened';
    document.querySelector('.main-panel')?.appendChild(toast);
    setTimeout(() => toast.remove(), 1400);
  });

  document.querySelector('.more-btn')?.addEventListener('click', () => {
    const card = document.querySelector('.session-card');
    card?.classList.toggle('menu-open');
  });

  document.querySelectorAll('.footer-row').forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('active');
    });
  });
});
