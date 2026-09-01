import process from 'node:process';

const FAST_MODEL = 'claude-3-5-haiku-20241022';
const REQUEST_TIMEOUT_MS = 8000;

export async function generateAnthropicSuggestion({ prompt, mode, question, role, company }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: FAST_MODEL,
        max_tokens: mode === 'practice' ? 280 : 220,
        temperature: 0.3,
        system: prompt,
        messages: [{
          role: 'user',
          content: `Question: ${question || 'None'} | Role: ${role || 'unknown'} | Company: ${company || 'unknown'} | Mode: ${mode || 'live'}`,
        }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data?.content?.find((block) => block.type === 'text')?.text || '{}';
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.warn('[Greenroom] Anthropic request timed out or failed:', error?.message || error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
