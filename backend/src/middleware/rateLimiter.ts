import rateLimit from 'express-rate-limit';

// Nur Login/Register/Passwort-Reset: 20 Versuche pro 15 Minuten
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anmeldeversuche. Bitte versuche es in 15 Minuten erneut.' },
});

// Nachrichten senden: 30 Requests pro Minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Nachrichten. Bitte warte einen Moment.' },
});

// Allgemein (alle Routen): 200 Requests pro Minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es gleich erneut.' },
});
