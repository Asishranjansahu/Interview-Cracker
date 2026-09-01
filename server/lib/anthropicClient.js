import process from 'node:process';

export async function generateAnthropicSuggestion({ prompt, mode, question, role, company }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: prompt,
      messages: [{ role: 'user', content: `Question: ${question || 'None'} | Role: ${role || 'unknown'} | Company: ${company || 'unknown'} | Mode: ${mode || 'live'}` }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.find((block) => block.type === 'text')?.text || '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
