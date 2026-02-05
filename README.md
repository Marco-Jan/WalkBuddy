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

**WalkBuddy** ist eine Plattform, auf der Hundebesitzer andere Hundebesitzer in ihrer Umgebung finden können, um gemeinsam Gassi zu gehen. Nachrichten zwischen Nutzern sind Ende-zu-Ende-verschlüsselt.

</div>

---

## Inhaltsverzeichnis

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Projektstruktur](#projektstruktur)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Tests](#tests)
- [Produktion / Deployment](#produktion--deployment)
- [Umgebungsvariablen](#umgebungsvariablen)
- [API-Endpunkte](#api-endpunkte)
- [Datenbank](#datenbank)

---

## Features

| Feature | Beschreibung |
|---|---|
| **Nutzerprofile** | Registrierung mit Hunde-Infos (Rasse, kastriert, Beschreibung), Profilbild-Upload, Geschlecht & Sichtbarkeitsfilter |
| **Verfügbarkeitsstatus** | Ein-Klick-Toggle um sich als "verfügbar" zu markieren |
| **Nutzer durchsuchen** | Verfügbare Hundebesitzer in der Umgebung finden, gefiltert nach Geschlecht und Blockierungen |
| **E2E-verschlüsselte Nachrichten** | ECDH P-256 Schlüsseltausch + AES-256-GCM, Schlüssel lokal in IndexedDB |
| **Posteingang** | Konversationsliste mit letzter Nachricht und Ungelesen-Indikator |
| **Blockieren & Melden** | Nutzer blockieren/entblocken, Nutzer mit Begründung melden |
| **Öffentliche Profile** | Profilseite anderer Nutzer einsehen |
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
│   │   │   ├── auth.ts         # Registrierung, Login, Profilbild
│   │   │   ├── blocks.ts       # Blockieren & Melden
│   │   │   ├── messages.ts     # Nachrichten-CRUD & Posteingang
│   │   │   └── status.ts       # Verfügbarkeit & Nutzerliste
│   │   ├── __tests__/          # Jest-Tests
│   │   ├── app.ts              # Express App-Factory
│   │   ├── db.ts               # DB-Schema & Migrationen
│   │   └── index.ts            # Server-Einstiegspunkt
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.ts          # Zentraler Axios-Client
│   │   ├── components/
│   │   │   ├── AccountCard.tsx  # Profil bearbeiten & Einstellungen
│   │   │   ├── Header.tsx       # Navigation & Status-Toggle
│   │   │   ├── LoginForm.tsx    # Login
│   │   │   ├── RegisterForm.tsx # Registrierung
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── UserCard.tsx     # Nutzerkarte
│   │   │   └── UserList.tsx     # Verfügbare Nutzer
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx    # Admin (Statistiken, Nutzer, Meldungen)
│   │   │   ├── InboxPage.tsx    # Posteingang
│   │   │   ├── MessagePage.tsx  # 1:1 Chat
│   │   │   └── UserProfilePage.tsx
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

## Produktion / Deployment

### Was wird benötigt

| Komponente | Beschreibung |
|---|---|
| **Server / VPS** | Linux-Server (z.B. Ubuntu 22.04+) mit Root-Zugang |
| **Node.js** | Version 18+ auf dem Server installiert |
| **Reverse Proxy** | Nginx oder Caddy als Reverse Proxy & HTTPS-Termination |
| **Domain** | Eine Domain mit DNS-A-Record auf die Server-IP |
| **SSL-Zertifikat** | Let's Encrypt via Certbot (kostenlos) oder anderer Anbieter |
| **PM2** | Process Manager zum dauerhaften Betrieb des Backends |
| **Firewall** | UFW oder iptables, nur Ports 80/443 offen |

### Schritt-für-Schritt

#### 1. Server vorbereiten

```bash
# Node.js installieren (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# PM2 global installieren
sudo npm install -g pm2

# Nginx installieren
sudo apt install -y nginx

# Certbot für SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Projekt auf den Server bringen

```bash
# Code auf den Server klonen/kopieren
git clone <repo-url> /opt/walkbuddy
cd /opt/walkbuddy

# Abhängigkeiten installieren
cd backend && npm install --production
cd ../frontend && npm install
```

#### 3. Frontend bauen

```bash
cd /opt/walkbuddy/frontend

# API-URL anpassen: In src/api/api.ts die baseURL auf die eigene Domain ändern
# z.B. https://walkbuddy.example.com/api

npm run build
```

Der Build-Output liegt dann in `frontend/build/` und wird von Nginx als statische Dateien ausgeliefert.

#### 4. Umgebungsvariablen setzen

```bash
# Datei /opt/walkbuddy/backend/.env erstellen (oder als Systemvariablen setzen)
export SESSION_SECRET="$(openssl rand -hex 64)"
export NODE_ENV="production"
```

> **Wichtig:** Das `SESSION_SECRET` muss bei jedem Serverneustart gleich sein, sonst werden alle Sessions ungültig. Am besten einmal generieren und fest speichern.

#### 5. Backend mit PM2 starten

```bash
cd /opt/walkbuddy/backend
pm2 start npm --name "walkbuddy-api" -- run start
pm2 save
pm2 startup  # Autostart bei Server-Reboot
```

#### 6. Nginx konfigurieren

```nginx
server {
    listen 80;
    server_name walkbuddy.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name walkbuddy.example.com;

    ssl_certificate     /etc/letsencrypt/live/walkbuddy.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/walkbuddy.example.com/privkey.pem;

    # Frontend (React Build)
    location / {
        root /opt/walkbuddy/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Profilbild-Uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
    }

    client_max_body_size 5M;
}
```

```bash
# Nginx testen & neuladen
sudo nginx -t
sudo systemctl reload nginx

# SSL-Zertifikat holen
sudo certbot --nginx -d walkbuddy.example.com
```

#### 7. Firewall konfigurieren

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Checkliste vor Go-Live

- [ ] `SESSION_SECRET` als feste Umgebungsvariable gesetzt
- [ ] Frontend `baseURL` auf Produktions-Domain geändert
- [ ] `secure: true` in der Session-Cookie-Config (index.ts) aktiviert
- [ ] CORS-Origin auf die Produktions-Domain umgestellt
- [ ] SSL-Zertifikat installiert und auto-renewal aktiv (`certbot renew --dry-run`)
- [ ] `backend/data/` Verzeichnis mit korrekten Schreibrechten
- [ ] PM2 Autostart konfiguriert (`pm2 startup`)
- [ ] Firewall aktiv, nur Ports 22/80/443 offen
- [ ] Regelmässige Backups der SQLite-Datenbank (`buddywalk.db`)

---

## Umgebungsvariablen

| Variable | Pflicht | Beschreibung | Standard |
|---|---|---|---|
| `SESSION_SECRET` | **Ja** (Produktion) | Geheimnis für Session-Signierung | Wird generiert (nicht persistent!) |
| `NODE_ENV` | Empfohlen | `production` oder `development` | `development` |

---

## API-Endpunkte

### Auth (`/auth`)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/register` | Neuen Nutzer registrieren |
| `POST` | `/login` | Einloggen |
| `POST` | `/logout` | Session beenden |
| `GET` | `/me` | Aktuellen Nutzer abrufen |
| `PUT` | `/me` | Profil aktualisieren |
| `POST` | `/upload-pic` | Profilbild hochladen (max 5 MB) |
| `POST` | `/keys` | E2EE-Schlüsselpaar speichern |
| `GET` | `/public-key/:userId` | Öffentlichen Schlüssel abrufen |

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

**Tabellen:** `users`, `messages`, `conversation_reads`, `blocks`, `reports`

**Speicherort:** `backend/data/buddywalk.db`

**Backup-Empfehlung:** Tägliches Kopieren der `.db`-Datei, z.B. via Cronjob:

```bash
0 3 * * * cp /opt/walkbuddy/backend/data/buddywalk.db /backups/walkbuddy/buddywalk_$(date +\%Y\%m\%d).db
```

---

<div align="center">

Erstellt mit TypeScript, React & Express

</div>
