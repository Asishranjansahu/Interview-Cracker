export class PracticeFeedback {
  constructor(rootId = 'cueCard') {
    this.root = document.getElementById(rootId);
  }

  render(result = {}) {
    const score = Number(result.score || 3);
    const strengths = Array.isArray(result.strengths) ? result.strengths : [];
    const weaknesses = Array.isArray(result.weaknesses) ? result.weaknesses : [];
    const rewritten = result.rewritten_answer || '';
    const note = result.note || '';

    this.root.innerHTML = `
      <div class="cue-card practice-card">
        <div class="label">Practice feedback</div>
        <div class="score-row">
          <span class="score-badge">${score}/5</span>
          <span>Overall interview signal</span>
        </div>
        <div class="feedback-section">
          <h4>Strengths</h4>
          <ul>${strengths.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
        </div>
        <div class="feedback-section">
          <h4>Weaknesses</h4>
          <ul>${weaknesses.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('')}</ul>
        </div>
        <div class="feedback-section">
          <h4>Sharper version</h4>
          <div class="answer-block">${this.escapeHtml(rewritten)}</div>
        </div>
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
