<div align="center">

# WalkBuddy

### Finde den perfekten Gassi-Partner für deinen Hund

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Chakra UI](https://img.shields.io/badge/Chakra_UI_v3-319795?style=for-the-badge&logo=chakraui&logoColor=white)](https://www.chakra-ui.com/)

![License](https://img.shields.io/badge/Lizenz-Privat-red?style=flat-square)
![Status](https://img.shields.io/badge/Status-In_Entwicklung-yellow?style=flat-square)

---

**WalkBuddy** ist eine Plattform, auf der Hundebesitzer andere Hundebesitzer in ihrer Umgebung finden können, um gemeinsam Gassi zu gehen. Alle Nachrichten zwischen Nutzern sind Ende-zu-Ende-verschlüsselt.

</div>

---

## Inhaltsverzeichnis

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Tests](#tests)
- [Umgebungsvariablen](#umgebungsvariablen)
- [API-Endpunkte](#api-endpunkte)
- [Datenbank](#datenbank)
- [Sicherheit](#sicherheit)

---

## Features

| Feature | Beschreibung |
|---|---|
| **Nutzerprofile** | Registrierung mit Hunde-Infos (Rasse, kastriert, Beschreibung), Profilbild-Upload, Geschlecht (m/w/d) & Sichtbarkeitsfilter |
| **Verfügbarkeitsstatus** | Ein-Klick-Toggle um sich als "verfügbar" zu markieren |
| **Status-Text** | Persönlicher Status-Text (max. 150 Zeichen), chronologischer Status-Feed auf der Startseite |
| **Nutzer durchsuchen** | Verfügbare Hundebesitzer finden, gefiltert nach Geschlecht und Blockierungen |
| **E2E-verschlüsselte Nachrichten** | ECDH P-256 Schlüsseltausch + AES-256-GCM, Schlüssel lokal in IndexedDB |
| **Posteingang** | Konversationsliste mit letzter Nachricht und Ungelesen-Indikator |
| **Chat löschen** | Einzelne Konversationen per Nutzer löschen (Soft-Delete, Partner sieht weiterhin alles) |
| **Blockieren & Melden** | Nutzer blockieren/entblocken, Nutzer mit Begründung melden |
| **Öffentliche Profile** | Profilseite anderer Nutzer einsehen |
| **E-Mail-Verifizierung** | Registrierung erfordert E-Mail-Bestätigung per Link, erneutes Senden möglich |
| **Passwort zurücksetzen** | "Passwort vergessen"-Flow mit E-Mail-Token (1 Stunde gültig) |
| **Account löschen** | Eigenen Account mit Passwort-Bestätigung deaktivieren (Soft-Delete) |
| **Onboarding** | 3-stufiges Willkommens-Modal nach erster Anmeldung |
| **Rate Limiting** | Schutz gegen Missbrauch: Auth (10/15min), Nachrichten (30/min), Allgemein (100/min) |
| **Admin-Dashboard** | Statistiken, Nutzerverwaltung, Meldungen bearbeiten (3 Tabs) |
| **Session-Auth** | Sichere Session-basierte Authentifizierung mit SQLite Session-Store |

---

## Tech Stack

### Backend

| Technologie | Zweck |
|---|---|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | Runtime |
| ![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white) | Web-Framework |
| ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) | Datenbank |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Typsicherheit |
| `express-session` + `connect-sqlite3` | Session-Management |
| `bcrypt` | Passwort-Hashing |
| `multer` | Datei-Upload (Profilbilder) |
| `nodemailer` | E-Mail-Versand (Verifizierung, Passwort-Reset) |
| `express-rate-limit` | Rate Limiting |

### Frontend

| Technologie | Zweck |
|---|---|
| ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) | UI-Framework |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Typsicherheit |
| ![Chakra UI](https://img.shields.io/badge/Chakra_UI_v3-319795?style=flat-square&logo=chakraui&logoColor=white) | Komponentenbibliothek |
| `react-router-dom` v7 | Client-Side Routing |
| `axios` | HTTP-Client |
| Web Crypto API | E2EE (ECDH + AES-GCM) |

### DevOps & Testing

| Technologie | Zweck |
|---|---|
| ![Jest](https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white) | Testing (Backend + Frontend) |
| `supertest` | API-Integration-Tests |
| `react-testing-library` | Komponenten-Tests |
| `nodemon` | Hot-Reload (Entwicklung) |

---

## Projektstruktur

```
WalkBuddy/
├── backend/
│   ├── data/
│   │   ├── uploads/            # Profilbild-Uploads
│   │   ├── buddywalk.db        # SQLite Datenbank
│   │   └── sessions.db         # Session-Store
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin.ts        # Admin-Dashboard & Verwaltung
│   │   │   ├── auth.ts         # Registrierung, Login, E-Mail, Passwort-Reset
│   │   │   ├── blocks.ts       # Blockieren & Melden
│   │   │   ├── messages.ts     # Nachrichten-CRUD, Posteingang, Chat löschen
│   │   │   └── status.ts       # Verfügbarkeit & Nutzerliste
│   │   ├── middleware/
│   │   │   └── rateLimiter.ts  # Rate Limiting Konfiguration
│   │   ├── __tests__/          # Jest-Tests
│   │   ├── app.ts              # Express App-Factory
│   │   ├── db.ts               # DB-Schema & Migrationen
│   │   └── index.ts            # Server-Einstiegspunkt
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── favicon.svg         # SVG-Favicon (Hundepfote)
│   │   ├── manifest.json       # PWA-Manifest
│   │   └── robots.txt          # Crawler-Konfiguration
│   ├── src/
│   │   ├── api/
│   │   │   └── api.ts          # Zentraler Axios-Client
│   │   ├── components/
│   │   │   ├── AccountCard.tsx  # Profil bearbeiten, Status, Account löschen
│   │   │   ├── Header.tsx       # Navigation & Status-Toggle
│   │   │   ├── LoginForm.tsx    # Login + Verifizierungs-Banner
│   │   │   ├── RegisterForm.tsx # Registrierung + E-Mail-Hinweis
│   │   │   ├── OnboardingModal.tsx # Willkommens-Slides
│   │   │   ├── StatusFeed.tsx   # Status-Feed aller Nutzer
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── UserCard.tsx     # Nutzerkarte
│   │   │   └── UserList.tsx     # Verfügbare Nutzer
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx    # Admin (Statistiken, Nutzer, Meldungen)
│   │   │   ├── InboxPage.tsx    # Posteingang
│   │   │   ├── MessagePage.tsx  # 1:1 Chat mit Kebab-Menü
│   │   │   ├── UserProfilePage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── crypto.ts           # E2EE-Implementierung
│   │   ├── theme.ts            # Chakra UI Farbschema
│   │   └── App.tsx             # Router & Layout
│   ├── tsconfig.json
│   └── package.json
└── package.json
```

---

## Lokale Entwicklung

### Voraussetzungen

- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Repository klonen
git clone <repo-url>
cd WalkBuddy

# Backend-Abhängigkeiten installieren
cd backend
npm install

# Frontend-Abhängigkeiten installieren
cd ../frontend
npm install
```

### Starten

Terminal 1 - Backend (Port 3000):
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend (Port 3001):
```bash
cd frontend
npm start
```

Die App ist dann erreichbar unter `http://localhost:3001`.

---

## Tests

```bash
# Backend-Tests (Jest + Supertest)
cd backend
npm test

# Frontend-Tests (React Testing Library)
cd frontend
npm test
```

---

## Umgebungsvariablen

### Backend (`backend/.env`)

| Variable | Pflicht | Beschreibung | Standard |
|---|---|---|---|
| `SESSION_SECRET` | **Ja** (Produktion) | Geheimnis für Session-Signierung | Wird generiert (nicht persistent!) |
| `NODE_ENV` | Empfohlen | `production` oder `development` | `development` |
| `SMTP_HOST` | Ja | SMTP-Server für E-Mail-Versand | - |
| `SMTP_PORT` | Ja | SMTP-Port | `587` |
| `SMTP_USER` | Ja | SMTP-Benutzername | - |
| `SMTP_PASS` | Ja | SMTP-Passwort | - |
| `SMTP_FROM` | Ja | Absender-Adresse | - |
| `APP_URL` | Ja | Frontend-URL (für Links in E-Mails) | - |
| `BACKEND_URL` | Ja | Backend-URL (für Verifizierungs-Links) | - |

---

## API-Endpunkte

### Auth (`/auth`)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/register` | Neuen Nutzer registrieren (sendet Verifizierungs-Mail) |
| `POST` | `/login` | Einloggen (erfordert verifizierte E-Mail) |
| `POST` | `/logout` | Session beenden |
| `GET` | `/me` | Aktuellen Nutzer abrufen |
| `PUT` | `/me` | Profil aktualisieren (inkl. Status-Text, Onboarding) |
| `DELETE` | `/me` | Account deaktivieren (Passwort erforderlich) |
| `POST` | `/upload-pic` | Profilbild hochladen (max 5 MB) |
| `POST` | `/keys` | E2EE-Schlüsselpaar speichern |
| `GET` | `/public-key/:userId` | Öffentlichen Schlüssel abrufen |
| `GET` | `/verify-email` | E-Mail-Adresse verifizieren (Token per Query) |
| `POST` | `/resend-verification` | Verifizierungs-Mail erneut senden |
| `POST` | `/forgot-password` | Passwort-Reset-Mail anfordern |
| `POST` | `/reset-password` | Neues Passwort setzen (Token + neues Passwort) |

### Status (`/status`)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/available` | Verfügbare Nutzer auflisten |
| `POST` | `/set` | Eigene Verfügbarkeit setzen |
| `GET` | `/user/:userId` | Nutzerprofil abrufen |

### Nachrichten (`/messages`)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/send` | Verschlüsselte Nachricht senden |
| `GET` | `/with/:userId` | Chatverlauf mit Nutzer |
| `GET` | `/inbox` | Posteingang (Konversationen) |
| `GET` | `/unread-count` | Anzahl ungelesener Konversationen |
| `POST` | `/mark-read/:otherId` | Konversation als gelesen markieren |
| `DELETE` | `/conversation/:otherId` | Konversation löschen (nur für eigenen Account) |

### Blockieren (`/blocks`)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/block` | Nutzer blockieren |
| `POST` | `/unblock` | Blockierung aufheben |
| `GET` | `/list` | Eigene Blockierliste |
| `POST` | `/report` | Nutzer melden |

### Admin (`/admin`) - erfordert Admin-Rolle

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/stats` | Dashboard-Statistiken |
| `GET` | `/users` | Alle Nutzer auflisten |
| `GET` | `/reports` | Alle Meldungen auflisten |
| `PUT` | `/reports/:id/resolve` | Meldung als erledigt markieren |
| `DELETE` | `/users/:id` | Nutzer deaktivieren (Soft-Delete) |

---

## Datenbank

Die SQLite-Datenbank wird beim ersten Start automatisch erstellt. Schema-Migrationen laufen automatisch in `db.ts`.

**Tabellen:** `users`, `messages`, `conversation_reads`, `blocks`, `reports`, `deleted_conversations`

**Speicherort:** `backend/data/buddywalk.db`

---

## Sicherheit

| Massnahme | Details |
|---|---|
| **Ende-zu-Ende-Verschlüsselung** | ECDH P-256 + AES-256-GCM, private Schlüssel verlassen nie das Gerät |
| **Passwort-Hashing** | bcrypt mit automatischem Salt |
| **Session-Sicherheit** | HTTP-only Cookies, Secure-Flag in Produktion |
| **Rate Limiting** | Auth: 10 Req/15min, Nachrichten: 30 Req/min, Allgemein: 100 Req/min |
| **E-Mail-Verifizierung** | Account-Aktivierung nur nach E-Mail-Bestätigung |
| **Soft-Delete** | Accounts und Nachrichten werden deaktiviert, nicht gelöscht |
| **Input-Validierung** | Eingaben werden serverseitig geprüft |

---

<div align="center">

Erstellt mit TypeScript, React & Express

</div>
