import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3001);
const DIST_PATH = path.resolve(__dirname, '../dist');
const DATA_DIR = path.join(__dirname, 'data');
const RSVP_PATH = path.join(DATA_DIR, 'rsvps.json');
const GUESTBOOK_PATH = path.join(DATA_DIR, 'guestbook.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const defaultRsvp = [];
  const defaultGuestbook = [];

  try {
    await fs.access(RSVP_PATH);
  } catch {
    await fs.writeFile(RSVP_PATH, JSON.stringify(defaultRsvp, null, 2), 'utf8');
  }

  try {
    await fs.access(GUESTBOOK_PATH);
  } catch {
    await fs.writeFile(GUESTBOOK_PATH, JSON.stringify(defaultGuestbook, null, 2), 'utf8');
  }
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/rsvp', async (req, res) => {
  const records = await readJson(RSVP_PATH, []);
  res.json(records);
});

app.post('/api/rsvp', async (req, res) => {
  const { name, status, guestCount, message } = req.body || {};

  if (!name || !status) {
    return res.status(400).json({ message: 'Nama dan status hadir wajib diisi.' });
  }

  const trimmedName = String(name).trim();
  const trimmedMessage = String(message || '').trim();
  const validatedStatus = ['Hadir', 'Tidak Hadir', 'Belum Bisa Memastikan'].includes(status)
    ? status
    : 'Belum Bisa Memastikan';

  const records = await readJson(RSVP_PATH, []);
  const existingIndex = records.findIndex(
    (entry) => String(entry.name).trim().toLowerCase() === trimmedName.toLowerCase()
  );

  const record = {
    id: existingIndex >= 0 ? records[existingIndex].id : crypto.randomUUID(),
    name: trimmedName,
    status: validatedStatus,
    guestCount: Number(guestCount) > 0 ? Math.min(Number(guestCount), 5) : 1,
    message: trimmedMessage,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }

  await writeJson(RSVP_PATH, records);

  if (trimmedMessage) {
    const guestbook = await readJson(GUESTBOOK_PATH, []);
    const existingGuestbook = guestbook.find(
      (entry) =>
        String(entry.name).trim().toLowerCase() === trimmedName.toLowerCase() &&
        String(entry.message).trim().toLowerCase() === trimmedMessage.toLowerCase()
    );

    if (!existingGuestbook) {
      guestbook.push({
        id: crypto.randomUUID(),
        name: trimmedName,
        message: trimmedMessage,
        createdAt: new Date().toISOString(),
      });
      await writeJson(GUESTBOOK_PATH, guestbook);
    }
  }

  res.status(200).json({ ok: true, record });
});

app.get('/api/guestbook', async (req, res) => {
  const guestbook = await readJson(GUESTBOOK_PATH, []);
  const sorted = [...guestbook].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json(sorted.slice(0, 10));
});

app.delete('/api/admin/guestbook/:id', async (req, res) => {
  const adminToken = req.headers['x-admin-key'];

  if (adminToken !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const guestbook = await readJson(GUESTBOOK_PATH, []);
  const filtered = guestbook.filter((entry) => entry.id !== req.params.id);

  await writeJson(GUESTBOOK_PATH, filtered);
  res.json({ ok: true, removed: req.params.id });
});

const assetEntries = [
  '/assets',
  '/assets/placeholder',
  '/assets/video',
  '/assets/audio',
];

for (const assetPath of assetEntries) {
  app.use(assetPath, express.static(path.resolve(__dirname, '../public' + assetPath)));
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_PATH));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

async function startServer() {
  await ensureDataFiles();

  app.listen(PORT, () => {
    console.log(`Wedding invitation server running on http://localhost:${PORT}`);
  });
}

startServer();
