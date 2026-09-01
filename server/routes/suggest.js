import express from 'express';
import { buildMasterPrompt, buildFallbackSuggestion } from '../prompts/masterPrompt.js';
import { generateAnthropicSuggestion } from '../lib/anthropicClient.js';

const router = express.Router();

router.post('/suggest', async (req, res) => {
  try {
    const payload = req.body || {};
    const prompt = buildMasterPrompt(payload);
    const result = await generateAnthropicSuggestion({ ...payload, prompt });
    if (result) {
      return res.json(result);
    }
    return res.json(buildFallbackSuggestion(payload));
  } catch (error) {
    console.warn('Suggestion generation failed, using local fallback.', error);
    return res.json(buildFallbackSuggestion(req.body || {}));
  }
});

export default router;
