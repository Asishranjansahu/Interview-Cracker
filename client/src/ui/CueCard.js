export class CueCard {
  constructor(rootId = 'cueCard') {
    this.root = document.getElementById(rootId);
  }

  renderLoading(question) {
    this.root.innerHTML = `
      <div class="cue-card cue-loading">
        <div class="label">Drafting response</div>
        <div class="question-inline">${this.escapeHtml(question || 'Listening...')}</div>
        <div class="pulse-row">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
  }

  renderSuggestion(suggestion = {}) {
    const bullets = Array.isArray(suggestion.bullets) ? suggestion.bullets : [];
    const fullAnswer = suggestion.full_answer || suggestion.rewritten_answer || '';
    const note = suggestion.note || '';

    this.root.innerHTML = `
      <div class="cue-card">
        <div class="label">Suggested answer</div>
        <ul class="bullet-list">
          ${bullets.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}
        </ul>
        <div class="answer-block">${this.escapeHtml(fullAnswer)}</div>
        ${note ? `<div class="note-box">${this.escapeHtml(note)}</div>` : ''}
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
