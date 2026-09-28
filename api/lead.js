// Vercel Function: приём заявок из формы «Праздник за 7 дней» (ТЗ §4, блок 18).
// Пересылает телефон в Telegram-бот. Переменные окружения (Vercel → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — id чата, куда слать заявки
// Пока переменных нет — честно отвечает 503, и форма показывает ошибку с телефоном для звонка.
// Дублирование на почту — следующим шагом (нужен SMTP или сервис отправки, ТЗ §9 п. 10).

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
  const phone = String(body.phone || '');
  if (!/^\+7\d{10}$/.test(phone) || body.consent !== true) return res.status(422).json({ ok: false });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(503).json({ ok: false, reason: 'not-configured' });

  const text = `Новая заявка с сайта\nТелефон: ${phone}\nСтраница: ${String(body.page || '').slice(0, 200)}`;
  const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text }),
  }).catch(() => null);

  if (!tg || !tg.ok) return res.status(502).json({ ok: false });
  return res.status(200).json({ ok: true });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
