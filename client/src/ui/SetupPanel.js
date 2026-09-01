export class SetupPanel {
  constructor({ onStart }) {
    this.onStart = onStart;
    this.root = document.getElementById('setupPanel');
    this.render();
  }

  render() {
    this.root.innerHTML = `
      <div class="panel-header">
        <h2>Candidate profile</h2>
        <span class="chip">Setup</span>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="role">Target role</label>
          <input id="role" type="text" value="Senior Product Manager" />
        </div>
        <div class="form-group">
          <label for="company">Target company</label>
          <input id="company" type="text" value="Northstar Labs" />
        </div>
        <div class="form-group">
          <label for="interview_type">Interview type</label>
          <select id="interview_type">
            <option value="behavioral">Behavioral</option>
            <option value="technical">Technical</option>
            <option value="case">Case Study</option>
            <option value="general">General</option>
          </select>
        </div>
        <div class="form-group">
          <label for="resume_text">Resume / background</label>
          <textarea id="resume_text">Led roadmap planning for a B2B SaaS product, owned discovery with enterprise customers, and improved retention by 28% through onboarding changes.</textarea>
        </div>
        <div class="form-group">
          <label for="job_description">Job description</label>
          <textarea id="job_description">We are looking for a product leader who can navigate ambiguity and drive customer-centered execution.</textarea>
        </div>
        <div class="form-group">
          <label for="company_culture">Culture notes</label>
          <textarea id="company_culture">Customer empathy, speed, and clear cross-functional collaboration.</textarea>
        </div>
        <div class="form-group">
          <label for="length_target">Length target</label>
          <select id="length_target">
            <option value="60-90 words">60-90 words</option>
            <option value="120-180 words">120-180 words</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="checkbox-row">
          <input id="stealthMode" type="checkbox" />
          <span>Stealth mode for screen share</span>
        </label>
      </div>
      <div class="button-row">
        <button id="liveModeBtn" class="btn btn-primary">Start live mode</button>
        <button id="practiceModeBtn" class="btn btn-secondary">Start practice mode</button>
      </div>
      <div class="small-note">The app will answer using local guidance when the server is unavailable.</div>
    `;

    this.root.querySelector('#liveModeBtn').addEventListener('click', () => this.onStart('live'));
    this.root.querySelector('#practiceModeBtn').addEventListener('click', () => this.onStart('practice'));
  }

  getValues() {
    return {
      role: document.getElementById('role').value,
      company: document.getElementById('company').value,
      interview_type: document.getElementById('interview_type').value,
      resume_text: document.getElementById('resume_text').value,
      job_description: document.getElementById('job_description').value,
      company_culture: document.getElementById('company_culture').value,
      length_target: document.getElementById('length_target').value,
      stealthMode: document.getElementById('stealthMode')?.checked || false,
    };
  }
}
