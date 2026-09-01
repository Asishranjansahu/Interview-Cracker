export function looksLikeQuestion(text, minWords = 4) {
  const cleaned = (text || '').trim();
  if (!cleaned) return false;

  const words = cleaned.split(/\s+/);
  if (words.length < minWords) return false;

  const strong = /\?(?:\s|$)/;
  const medium = /\b(who|what|when|where|why|how|tell me about|walk me through|describe|explain|can you|could you|would you|give me|talk about|what's your|how do you|have you ever)\b/i;

  if (strong.test(cleaned) || medium.test(cleaned)) return true;
  return false;
}

export function getSilenceDelay() {
  return 1500;
}
