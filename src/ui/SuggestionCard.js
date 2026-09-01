/**
 * SuggestionCard — renders interview suggestions as glanceable bullet cards.
 * Designed for a small floating window with minimal chrome.
 */

export class SuggestionCard {
  constructor(containerId = "greenroom-root") {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }
    this._applyBaseStyles();
    this.history = [];
  }

  _applyBaseStyles() {
    Object.assign(this.container.style, {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: "18px",
      lineHeight: "1.5",
      color: "#f0f0f0",
      background: "#1a1a2e",
      padding: "20px",
      borderRadius: "12px",
      maxWidth: "500px",
      margin: "0 auto",
      minHeight: "200px",
    });
  }

  showLoading(question) {
    this.container.innerHTML = `
      <div style="opacity: 0.6; margin-bottom: 12px; font-size: 14px;">
        Hearing question...
      </div>
      <div style="font-size: 16px; font-style: italic; color: #888;">
        "${this._escapeHtml(question || "...")}"
      </div>
      <div style="margin-top: 20px; display: flex; gap: 8px;">
        <span style="animation: pulse 1s infinite;">●</span>
        <span style="animation: pulse 1s infinite 0.3s;">●</span>
        <span style="animation: pulse 1s infinite 0.6s;">●</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      </style>
    `;
  }

  showSuggestion(suggestion) {
    if (!suggestion) return;

    const { bullets = [], full_answer = "", note = "" } = suggestion;

    let html = "";

    // Bullets — the primary glanceable content
    if (bullets.length > 0) {
      html += `<ul style="list-style: none; padding: 0; margin: 0 0 16px 0;">`;
      for (const bullet of bullets) {
        html += `
          <li style="
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 17px;
            line-height: 1.4;
          ">
            <span style="color: #4fc3f7; margin-right: 8px;">→</span>
            ${this._escapeHtml(bullet)}
          </li>`;
      }
      html += `</ul>`;
    }

    // Full answer — secondary, smaller text for detail
    if (full_answer) {
      html += `
        <div style="
          font-size: 14px;
          line-height: 1.6;
          color: #aaa;
          margin-top: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
        ">
          ${this._escapeHtml(full_answer)}
        </div>`;
    }

    // Note — warning/info if present
    if (note) {
      html += `
        <div style="
          font-size: 13px;
          color: #ffb74d;
          margin-top: 12px;
          padding: 8px 12px;
          background: rgba(255, 183, 77, 0.1);
          border-radius: 6px;
          border-left: 3px solid #ffb74d;
        ">
          ⚠ ${this._escapeHtml(note)}
        </div>`;
    }

    // Timestamp
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `
      <div style="
        margin-top: 12px;
        font-size: 11px;
        color: #666;
        text-align: right;
      ">
        ${time}
      </div>`;

    this.container.innerHTML = html;

    // Add to history
    this.history.push({ suggestion, timestamp: Date.now() });
  }

  showStatus(message, type = "info") {
    const colors = {
      info: "#4fc3f7",
      error: "#ef5350",
      success: "#66bb6a",
    };

    this.container.innerHTML = `
      <div style="
        padding: 16px;
        text-align: center;
        font-size: 15px;
        color: ${colors[type] || colors.info};
      ">
        ${this._escapeHtml(message)}
      </div>`;
  }

  showWelcome() {
    this.container.innerHTML = `
      <div style="
        text-align: center;
        padding: 40px 20px;
        color: #666;
      ">
        <div style="font-size: 24px; margin-bottom: 12px;">🎙️</div>
        <div style="font-size: 16px;">Greenroom is active</div>
        <div style="font-size: 13px; margin-top: 8px; color: #555;">
          Listening for interviewer questions...
        </div>
      </div>`;
  }

  getHistory() {
    return this.history;
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
