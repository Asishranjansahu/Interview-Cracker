export function createProfile(values = {}) {
  return {
    role: values.role || '',
    company: values.company || '',
    interview_type: values.interview_type || 'behavioral',
    resume_text: values.resume_text || '',
    job_description: values.job_description || '',
    company_culture: values.company_culture || '',
    length_target: values.length_target || '60-90 words',
    anthropicApiKey: values.anthropicApiKey || '',
    deepgramApiKey: values.deepgramApiKey || '',
    question_type: values.question_type || values.interview_type || 'behavioral',
    mode: values.mode || 'live',
    candidate_answer: values.candidate_answer || '',
    stealthMode: Boolean(values.stealthMode),
  };
}
