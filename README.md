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

## Features

| Feature | Beschreibung |
|---|---|
| **Nutzerprofile** | Registrierung mit Hunde-Infos, Profilbild-Upload, Geschlecht (m/w/d) & Sichtbarkeitsfilter |
| **Verfügbarkeitsstatus** | Ein-Klick-Toggle um sich als "verfügbar" zu markieren |
| **Bidirektionaler Sichtbarkeitsfilter** | "Nur Frauen/Männer/Divers sehen" — wirkt in beide Richtungen: Wer z.B. "Nur Frauen" wählt, sieht nur Frauen und wird nur von Frauen gesehen |
| **Status-Text** | Persönlicher Status-Text mit chronologischem Feed auf der Startseite |
| **Städte-Autocomplete** | Stadtsuche via OpenStreetMap-Daten (DE/AT/CH) |
| **Nutzer durchsuchen** | Verfügbare Hundebesitzer finden, sortiert nach Stadtnähe |
| **E2E-verschlüsselte Nachrichten** | Private Schlüssel verlassen nie das Gerät |
| **Posteingang** | Konversationsliste mit Ungelesen-Indikator |
| **Blockieren & Melden** | Nutzer blockieren/entblocken und mit Begründung melden |
| **E-Mail-Verifizierung** | Account-Aktivierung per E-Mail-Bestätigung |
| **Passwort zurücksetzen** | "Passwort vergessen"-Flow per E-Mail |
| **Account löschen** | Eigenen Account mit Passwort-Bestätigung deaktivieren |
| **Onboarding** | Willkommens-Slides für neue Nutzer |
| **System-Ankündigungen** | Admin erstellt Ankündigungen, die allen Nutzern als Banner angezeigt werden |
| **Admin-Dashboard** | Statistiken (Online-Count, Meldungen, Kontaktanfragen), Nutzerverwaltung, Meldungen, Log mit Sortierung & Filter, Ankündigungen, User-CSV-Export, Warn-Flags |

---

## Tech Stack

### Backend

| Technologie | Zweck |
|---|---|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | Runtime |
| ![Express](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white) | Web-Framework |
| ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) | Datenbank |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Typsicherheit |

### Frontend

| Technologie | Zweck |
|---|---|
| ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) | UI-Framework |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Typsicherheit |
| ![Chakra UI](https://img.shields.io/badge/Chakra_UI_v3-319795?style=flat-square&logo=chakraui&logoColor=white) | Komponentenbibliothek |

---

## Lokale Entwicklung

### Voraussetzungen

- **Node.js** >= 18
- **npm** >= 9

### Installation

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Starten

```bash
# Backend (Port 3000)
cd backend && npm run dev

# Frontend (Port 3001)
cd frontend && npm start
```

### Umgebungsvariablen

Das Backend benötigt eine `.env`-Datei. Siehe `.env.example` für die benötigten Variablen.

---

## Sicherheit

- Ende-zu-Ende-verschlüsselte Nachrichten
- Passwort-Richtlinie: min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl & Sonderzeichen
- Passwörter werden gehasht gespeichert
- Session-basierte Authentifizierung mit sicheren Cookies
- Rate Limiting gegen Missbrauch
- E-Mail-Verifizierung bei Registrierung
- Soft-Delete statt endgültiger Löschung
- CSV-Export nur mit Admin-Passwort-Bestätigung (max 1/min)
- Bidirektionaler Sichtbarkeitsfilter verhindert ungewollte Kontaktaufnahme

---

## Admin-Features

| Feature | Beschreibung |
|---|---|
| **Dashboard** | Benutzer-Anzahl, Online-Count (aktiv in letzten 5 Min), offene Meldungen, Kontaktanfragen |
| **Nutzerverwaltung** | Suche, Profilbild-Anzeige, Deaktivierung, Warn-Flags (automatisch ab 2 offenen Meldungen) |
| **Meldungen** | Alle Reports mit Reporter/Gemeldeter-Info, als erledigt markieren |
| **Kontaktanfragen** | Nachrichten lesen, als gelesen markieren, loeschen |
| **Log** | Chronologische Uebersicht aller Aktivitaeten mit Sortierung (Zeit/Typ) und Filter-Chips (Kontakt/Meldung/Nachricht) |
| **Ankuendigungen** | System-Ankuendigungen erstellen und loeschen, sichtbar fuer alle Nutzer |
| **User-Export** | CSV-Download (Name, Email, Stadt, Hundename, Aktiv) mit Passwort-Bestaetigung und Rate-Limit |
| **Warn-Flags** | Automatische Markierung bei 2+ Meldungen, manuelles Verwarnen/Aufheben durch Admin |
| **Gear-Icon** | Admin-Icon in der Navigation wird orange bei offenen Meldungen oder ungelesenen Kontaktanfragen |

---

<div align="center">

Erstellt mit TypeScript, React & Express

</div>
