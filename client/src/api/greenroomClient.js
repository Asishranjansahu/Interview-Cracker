import { createProfile } from '../state/profileStore.js';

const REQUEST_TIMEOUT_MS = 8000;

export async function generateSuggestion(profile, question, mode = 'live') {
  const normalizedProfile = createProfile(profile);
  const body = {
    mode,
    question,
    question_type: normalizedProfile.question_type,
    role: normalizedProfile.role,
    company: normalizedProfile.company,
    resume_text: normalizedProfile.resume_text,
    job_description: normalizedProfile.job_description,
    company_culture: normalizedProfile.company_culture,
    length_target: normalizedProfile.length_target,
    candidate_answer: normalizedProfile.candidate_answer,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[Greenroom] Suggestion request timed out or failed:', error?.message || error);
    const fallback = {
      bullets: [
        'Lead with the strongest example.',
        'Keep the answer concrete and brief.',
        'Tie it back to the role needs.',
      ],
      full_answer: `I’d answer this by connecting the question to the most relevant experience in my background, then highlight the action I took and the outcome it created. I’d keep it concise, clear, and tied directly to the needs of this role and company.`,
      note: 'Fallback local coaching mode activated because the server response was unavailable.',
      score: 3,
      strengths: ['Clear structure', 'Relevant to the role'],
      weaknesses: ['Could be more specific'],
      rewritten_answer: `I’d frame this around the challenge, the action I took, and the impact it created. I’d keep it focused on the needs of this role and the business outcome that mattered most.`,
    };
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
