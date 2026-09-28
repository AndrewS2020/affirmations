import express from 'express';
import cors from 'cors';
import webPush from 'web-push';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const AFFIRMATIONS_FILE = path.join(DATA_DIR, 'affirmations.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Initialize or Load VAPID Keys
let vapidKeys;
if (fs.existsSync(VAPID_FILE)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed reading VAPID file, generating new keys:', err);
  }
}

if (!vapidKeys || !vapidKeys.publicKey || !vapidKeys.privateKey) {
  vapidKeys = webPush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf8');
  console.log('✅ Generated new VAPID keys for Web Push');
}

webPush.setVapidDetails(
  'mailto:mindful@affirmations-pwa.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Helpers for Data Files
function loadAffirmations() {
  try {
    if (fs.existsSync(AFFIRMATIONS_FILE)) {
      return JSON.parse(fs.readFileSync(AFFIRMATIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading affirmations:', e);
  }
  return [];
}

function saveAffirmations(data) {
  fs.writeFileSync(AFFIRMATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function loadSubscriptions() {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading subscriptions:', e);
  }
  return [];
}

function saveSubscriptions(data) {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Push notification sender helper with dead subscription pruning
async function sendPushToAll(payload) {
  const subscriptions = loadSubscriptions();
  if (subscriptions.length === 0) {
    console.log('No active push subscriptions found');
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  const activeSubs = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(sub.subscription, JSON.stringify(payload));
      sent++;
      activeSubs.push(sub);
    } catch (err) {
      failed++;
      console.warn(`Failed push to sub (${sub.device || 'unknown'}):`, err.statusCode || err.message);
      // If 404 or 410, subscription has expired or unsubscribed
      if (err.statusCode !== 404 && err.statusCode !== 410) {
        activeSubs.push(sub); // Keep if transient error
      }
    }
  }

  if (activeSubs.length !== subscriptions.length) {
    saveSubscriptions(activeSubs);
    console.log(`Pruned ${subscriptions.length - activeSubs.length} dead push subscriptions`);
  }

  return { sent, failed };
}

// ----------------- API Router -----------------
const apiRouter = express.Router();

// Get VAPID public key
apiRouter.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Get all affirmations
apiRouter.get('/affirmations', (req, res) => {
  const affirmations = loadAffirmations();
  res.json(affirmations);
});

// Create new affirmation
apiRouter.post('/affirmations', (req, res) => {
  const { text, category, theme, font, schedule, isFavorite } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Текст аффирмации обязателен' });
  }

  const affirmations = loadAffirmations();
  const newAffirmation = {
    id: `aff-${Date.now()}`,
    text: text.trim(),
    category: category || 'Личное',
    theme: theme || 'ocean',
    font: font || 'serif',
    isFavorite: !!isFavorite,
    createdAt: new Date().toISOString(),
    schedule: {
      enabled: schedule?.enabled ?? false,
      times: schedule?.times || ['09:00'],
      days: schedule?.days || [1, 2, 3, 4, 5, 6, 7],
      mode: schedule?.mode || 'specific',
      intervalHours: schedule?.intervalHours || 3,
      vibrate: schedule?.vibrate ?? true,
      sound: schedule?.sound ?? true
    }
  };

  affirmations.unshift(newAffirmation);
  saveAffirmations(affirmations);
  res.status(201).json(newAffirmation);
});

// Update affirmation
apiRouter.put('/affirmations/:id', (req, res) => {
  const { id } = req.params;
  const affirmations = loadAffirmations();
  const index = affirmations.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(400).json({ error: 'Аффирмация не найдена' });
  }

  const existing = affirmations[index];
  affirmations[index] = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  saveAffirmations(affirmations);
  res.json(affirmations[index]);
});

// Delete affirmation
apiRouter.delete('/affirmations/:id', (req, res) => {
  const { id } = req.params;
  const affirmations = loadAffirmations();
  const filtered = affirmations.filter((a) => a.id !== id);

  if (filtered.length === affirmations.length) {
    return res.status(404).json({ error: 'Аффирмация не найдена' });
  }

  saveAffirmations(filtered);
  res.json({ success: true, id });
});

// Subscribe to Web Push
apiRouter.post('/subscribe', (req, res) => {
  const { subscription, device } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription payload' });
  }

  const subscriptions = loadSubscriptions();
  const existsIndex = subscriptions.findIndex((s) => s.subscription.endpoint === subscription.endpoint);

  const subEntry = {
    id: `sub-${Date.now()}`,
    subscription,
    device: device || 'Mobile Device',
    updatedAt: new Date().toISOString()
  };

  if (existsIndex >= 0) {
    subscriptions[existsIndex] = subEntry;
  } else {
    subscriptions.push(subEntry);
  }

  saveSubscriptions(subscriptions);
  console.log(`📱 Push subscription registered (${subscriptions.length} total active)`);
  res.json({ success: true, count: subscriptions.length });
});

// Unsubscribe from Web Push
apiRouter.post('/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }

  const subscriptions = loadSubscriptions();
  const filtered = subscriptions.filter((s) => s.subscription.endpoint !== endpoint);
  saveSubscriptions(filtered);
  res.json({ success: true });
});

// Send a test push notification
apiRouter.post('/test-push', async (req, res) => {
  const { text, title, affirmationId } = req.body;
  const payload = {
    title: title || '✨ Твоя аффирмация дня',
    body: text || 'Я нахожусь в гармонии с собой и миром вокруг меня.',
    id: affirmationId || null,
    url: affirmationId ? `/affirmations/?affirmationId=${affirmationId}` : '/affirmations/'
  };

  try {
    const result = await sendPushToAll(payload);
    res.json({ success: true, ...result, message: `Отправлено на ${result.sent} устройств(а)` });
  } catch (err) {
    console.error('Error sending test push:', err);
    res.status(500).json({ error: 'Ошибка отправки пуш-уведомления', details: err.message });
  }
});

// Send a specific affirmation push right now
apiRouter.post('/send-affirmation-push', async (req, res) => {
  const { id } = req.body;
  const affirmations = loadAffirmations();
  const aff = affirmations.find((a) => a.id === id);

  if (!aff) {
    return res.status(404).json({ error: 'Аффирмация не найдена' });
  }

  const payload = {
    title: `✨ ${aff.category || 'Аффирмация'}`,
    body: aff.text,
    id: aff.id,
    url: `/affirmations/?affirmationId=${aff.id}`
  };

  try {
    const result = await sendPushToAll(payload);
    res.json({ success: true, ...result, affirmation: aff });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка отправки', details: err.message });
  }
});

// Status & diagnostics
apiRouter.get('/scheduler/status', (req, res) => {
  const affirmations = loadAffirmations();
  const subscriptions = loadSubscriptions();
  const scheduledAffirmations = affirmations.filter((a) => a.schedule && a.schedule.enabled);

  res.json({
    activeSubscriptions: subscriptions.length,
    scheduledCount: scheduledAffirmations.length,
    currentTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }),
    currentDay: new Date().getDay() === 0 ? 7 : new Date().getDay()
  });
});

// Mount router on both /api and /affirmations/api
app.use('/api', apiRouter);
app.use('/affirmations/api', apiRouter);

// ----------------- Cron Scheduler Worker -----------------
// Runs every minute to evaluate scheduled affirmations
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeString = `${currentHours}:${currentMinutes}`;
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

  const affirmations = loadAffirmations();
  const activeAffirmations = affirmations.filter((a) => a.schedule && a.schedule.enabled);

  for (const aff of activeAffirmations) {
    const { schedule } = aff;
    if (!schedule || !schedule.enabled) continue;

    const days = schedule.days || [1, 2, 3, 4, 5, 6, 7];
    if (!days.includes(currentDayOfWeek)) {
      continue;
    }

    const times = schedule.times || [];
    if (times.includes(currentTimeString)) {
      console.log(`⏰ [CRON] Triggering scheduled notification for "${aff.text.substring(0, 30)}..." at ${currentTimeString}`);
      const payload = {
        title: `✨ ${aff.category || 'Аффирмация'}`,
        body: aff.text,
        id: aff.id,
        url: `/affirmations/?affirmationId=${aff.id}`
      };
      await sendPushToAll(payload);
    }
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use('/affirmations', express.static(distPath));
  app.use(express.static(distPath));

  app.get('/affirmations*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌸 Affirmations Backend running on port ${PORT}`);
});
