import rateLimit from 'express-rate-limit';

// Auth-Endpunkte (Login, Register, Forgot-Password): 10 Requests pro 15 Minuten
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es in 15 Minuten erneut.' },
});

// Nachrichten senden: 30 Requests pro Minute
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Nachrichten. Bitte warte einen Moment.' },
});

// Allgemein (Fallback): 100 Requests pro Minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es gleich erneut.' },
});
