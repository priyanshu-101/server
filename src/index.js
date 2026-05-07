import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { fdsRouter } from './routes/fds.js';
import { insurancesRouter } from './routes/insurances.js';

const PORT = Number(process.env.PORT);
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/fds', fdsRouter);
app.use('/api/insurances', insurancesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
