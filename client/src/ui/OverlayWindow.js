export class OverlayWindow {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'floating-overlay';
    this.element.innerHTML = `
      <div class="floating-inner">
        <div class="floating-title">Greenroom</div>
        <div class="floating-meta">Live cue</div>
      </div>
    `;
    document.body.appendChild(this.element);
  }

  setContent({ title = 'Greenroom', question = 'Live cue ready', summary = 'Keep it brief and specific.' }) {
    this.element.innerHTML = `
      <div class="floating-inner">
        <div class="floating-title">${this.escapeHtml(title)}</div>
        <div class="floating-question">${this.escapeHtml(question)}</div>
        <div class="floating-summary">${this.escapeHtml(summary)}</div>
      </div>
    `;
    this.show();
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
