import express from 'express';
import session from 'express-session';

const app = express();
app.use(express.json());
app.use(session({ secret: 'dev-secret', resave: false, saveUninitialized: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/tatum', (req, res) => {
  const { type, currency, bankCode } = req.body || {};
  if (!type || !currency) {
    return res.status(400).json({ error: 'type and currency are required' });
  }
  if (type === 'virtualAccount') {
    return res.json({ id: 'va_' + Date.now(), currency, kind: 'virtualAccount' });
  }
  if (type === 'fiatWallet') {
    if (!bankCode) {
      return res.status(400).json({ error: 'bankCode required for fiatWallet' });
    }
    return res.json({ id: 'fw_' + Date.now(), currency, kind: 'fiatWallet', bankConnection: { bankCode } });
  }
  return res.status(400).json({ error: 'unknown type' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[backend] server listening on port ${PORT}`);
});

export default app;