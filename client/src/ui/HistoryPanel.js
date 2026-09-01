export class HistoryPanel {
  constructor(rootId = 'historyPanel') {
    this.root = document.getElementById(rootId);
    this.entries = [];
  }

  add(entry) {
    this.entries.push(entry);
    this.render();
  }

  render() {
    const recent = this.entries.slice(-4).reverse();
    if (!recent.length) {
      this.root.innerHTML = `
        <div class="history-box">
          <div class="label">Recent prompts</div>
          <div class="history-empty">No prompts yet.</div>
        </div>
      `;
      return;
    }

    this.root.innerHTML = `
      <div class="history-box">
        <div class="label">Recent prompts</div>
        <ul class="history-list">
          ${recent.map((entry) => `
            <li>
              <div class="history-q">${this.escapeHtml(entry.question || 'Interview question')}</div>
              <div class="history-a">${this.escapeHtml((entry.suggestion?.full_answer || entry.suggestion?.rewritten_answer || '').slice(0, 140))}</div>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
