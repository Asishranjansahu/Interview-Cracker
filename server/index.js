import 'dotenv/config';
import express from 'express';
import suggestRoute from './routes/suggest.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '1mb' }));
app.use('/api', suggestRoute);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'greenroom-server' });
});

app.listen(PORT, () => {
  console.log(`Greenroom server listening on http://localhost:${PORT}`);
});
