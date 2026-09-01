export function buildMasterPrompt(payload = {}) {
  const mode = payload.mode || 'live';
  const questionType = payload.question_type || payload.interview_type || 'general';
  const role = payload.role || 'unknown';
  const company = payload.company || 'unknown';
  const resumeText = payload.resume_text || 'not provided';
  const jobDescription = payload.job_description || 'not provided';
  const companyCulture = payload.company_culture || '';
  const lengthTarget = payload.length_target || '60-90 words';
  const question = payload.question || '';
  const candidateAnswer = payload.candidate_answer || '';

  if (mode === 'practice') {
    return `You are Greenroom, an AI interview co-pilot. You operate in one of two contexts: LIVE (an active real interview, seconds matter) or PRACTICE (a mock interview, feedback matters more than speed). You are told which mode you're in.

MODE: practice
QUESTION_TYPE: ${questionType}

CANDIDATE CONTEXT
- Target role: ${role}
- Target company: ${company}
- Resume / background notes: ${resumeText}
- Job description: ${jobDescription}
- Company values / culture notes: ${companyCulture}
- Length target: ${lengthTarget}

INTERVIEWER'S QUESTION
"${question}"

CANDIDATE'S OWN ANSWER
"${candidateAnswer}"

Output ONLY this JSON, no markdown fences, no preamble:
{
  "score": 1-5,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "rewritten_answer": "...",
  "note": ""
}`;
  }

  return `You are Greenroom, an AI interview co-pilot. You operate in one of two contexts: LIVE (an active real interview, seconds matter) or PRACTICE (a mock interview, feedback matters more than speed). You are told which mode you're in.

MODE: live
QUESTION_TYPE: ${questionType}

CANDIDATE CONTEXT
- Target role: ${role}
- Target company: ${company}
- Resume / background notes: ${resumeText}
- Job description: ${jobDescription}
- Company values / culture notes: ${companyCulture}
- Length target: ${lengthTarget}

INTERVIEWER'S QUESTION
"${question}"

Output ONLY this JSON, no markdown fences, no preamble:
{
  "bullets": ["...", "...", "..."],
  "full_answer": "...",
  "note": ""
}`;
}

export function buildFallbackSuggestion(payload = {}) {
  const question = payload.question || 'Tell me about yourself.';
  const role = payload.role || 'the role';
  const company = payload.company || 'the company';
  const mode = payload.mode || 'live';

  if (mode === 'practice') {
    return {
      score: 3,
      strengths: ['Clear structure', 'Relevant to the role'],
      weaknesses: ['Could add more specific examples', 'Tighten your answer to the actual business outcome'],
      rewritten_answer: `I’d frame my response around the challenge, the actions I took, and the business result it created. I’d keep it anchored to the needs of ${role.toLowerCase()} and the value I could bring to ${company}.`,
      note: 'Fallback coaching mode activated because the model response was unavailable.',
    };
  }

  return {
    bullets: [
      'Lead with the strongest example.',
      'Keep it concrete and brief.',
      'Tie back to the role needs.',
    ],
    full_answer: `I’d answer this by connecting the question to the most relevant experience I have in ${role.toLowerCase()}, then explain the action I took and the outcome it created. I’d make the answer specific, grounded in the business need, and tie it back to why it matters for ${company}.`,
    note: 'Fallback local coaching mode activated because a model response was unavailable.',
  };
}
