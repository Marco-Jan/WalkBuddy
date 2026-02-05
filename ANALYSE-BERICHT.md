# WalkBuddy - Vollständiger Analyse- und Testbericht

## Testergebnisse

| Bereich | Tests | Status |
|---------|-------|--------|
| **Backend (neu geschrieben)** | 52 Tests | 52/52 bestanden |
| **Frontend (neu geschrieben)** | 28 Tests | 28/28 bestanden |
| **Frontend (vorher)** | 1 Test | Kaputt (suchte nach "learn react") |
| **Gesamt** | **80 Tests** | **80/80 bestanden** |

---

## KRITISCHE Sicherheitslücken

### 1. Session Secret ist `'1234'` (KRITISCH)
**Datei:** `backend/src/index.ts:31`
```
secret: '1234', //TODO:unbeding ändern
```
Jeder kann Sessions fälschen. Das Secret muss ein langer, zufälliger String sein und aus einer Umgebungsvariable kommen (z.B. `process.env.SESSION_SECRET`).

### 2. ProtectedRoute nutzt localStorage als Auth-Bypass (KRITISCH)
**Datei:** `frontend/src/components/ProtectedRoute.tsx:13`
```typescript
const currentUser = user || JSON.parse(localStorage.getItem('currentUser') || 'null');
```
Ein Angreifer kann im Browser `localStorage.setItem('currentUser', '{"id":"fake"}')` setzen und wird als eingeloggt behandelt -- ohne gültige Session. Die Backend-API-Calls schlagen dann zwar fehl (401), aber die geschützten UI-Routen werden trotzdem gerendert.

### 3. Debug-Endpoint `/status/all` ist öffentlich zugänglich (HOCH)
**Datei:** `backend/src/routes/status.ts:14`
Dieser Endpoint gibt **alle User** ohne Auth zurück. Kein Session-Check. Jeder kann die komplette Userliste abrufen (Name, Email, Geschlecht, Hundename, Stadt, PLZ).

### 4. `markMessagesRead()` ruft nicht-existierenden Endpoint auf (BUG)
**Datei:** `frontend/src/api/api.ts:37`
```typescript
export const markMessagesRead = async () => {
  const res = await axios.post(`${BASE_URL}/messages/mark-read`);
```
Der Backend-Endpoint `POST /messages/mark-read` (ohne `:otherId`) existiert nicht -- er ist auskommentiert (`backend/src/routes/messages.ts:179-198`). Der korrekte Endpoint ist `POST /messages/mark-read/:otherId`. Der Aufruf in `Header.tsx:53` schlägt daher immer fehl.

### 5. Keine Passwort-Validierung bei Registrierung (MITTEL)
**Datei:** `backend/src/routes/auth.ts:30`
Es gibt keine Mindestlänge, keine Komplexitätsanforderung. Ein Passwort wie `"1"` wird akzeptiert.

### 6. Keine Rate-Limiting (MITTEL)
Kein Schutz gegen Brute-Force-Login-Versuche oder Spam-Nachrichten. Ein Angreifer kann unbegrenzt Passwörter probieren oder Nachrichten fluten.

---

## Logik-Bugs

### 7. `Home.tsx` wird nicht verwendet und hat eigenen isolierten State
**Datei:** `frontend/src/pages/Home.tsx`
Diese Komponente erstellt einen eigenen `user`-State (`useState<User | null>(null)`), der nie befüllt wird. Sie wird aber in der App nicht geroutet -- `App.tsx` nutzt direkt `<UserList />` für `/`. Die Datei ist toter Code.

### 8. LoginForm speichert User in localStorage, aber nur dort
**Datei:** `frontend/src/components/LoginForm.tsx:27`
```typescript
localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
```
`RegisterForm` tut das NICHT. Das führt zu inkonsistentem Verhalten: Nach Login bleibt der User bei Reload (via ProtectedRoute localStorage-Fallback), nach Registrierung nicht. Allerdings ist der localStorage-Fallback selbst ein Sicherheitsproblem (siehe #2).

### 9. Logout löscht localStorage nicht
**Datei:** `frontend/src/App.tsx:36-43`
Nach Logout bleibt `currentUser` im localStorage. ProtectedRoute lässt den User weiterhin durch.

### 10. Keine UUID-Validierung im `/messages/partner/:otherId` Endpoint
**Datei:** `backend/src/routes/messages.ts:119-139`
Im Gegensatz zu `/messages/with/:userId` (Zeile 67-71) fehlt hier die UUID-Validierung. Beliebige Strings können als `otherId` übergeben werden.

### 11. Keine UUID-Validierung in `/messages/mark-read/:otherId`
**Datei:** `backend/src/routes/messages.ts:200-221`
Gleich wie #10 -- keine Validierung der `otherId`.

---

## Datenbank-Probleme

### 12. Tippfehler in Schema: `DEFAUL` statt `DEFAULT`
**Datei:** `backend/src/db.ts:24-26`
```sql
city TEXT DEFAUL NULL,
area TEXT DEFAUL NULL,
postalCode TEXT DEFAUL NULL,
```
SQLite ignoriert unbekannte Constraint-Keywords still, daher funktioniert es zufällig. Es sollte `DEFAULT` heißen.

### 13. Kein Index auf `messages(senderId)`, `messages(receiverId)`
Die Inbox- und Unread-Count-Queries joinen/filtern über `senderId` und `receiverId`, aber es gibt keine Indizes. Bei wachsender Datenmenge werden diese Queries langsam.

### 14. Kein `ON DELETE CASCADE` für Fremdschlüssel
Wenn ein User gelöscht wird (derzeit nicht möglich, aber als zukünftiges Feature), bleiben seine Nachrichten als verwaiste Einträge.

---

## Fehlende Fehlerbehandlung

### 15. `meRow` kann `undefined` sein
**Datei:** `backend/src/routes/messages.ts:34-39`
```typescript
const meRow = await db.get(`SELECT gender FROM users WHERE id = ?`, [senderId]);
if (receiver.visibleToGender !== 'all' && receiver.visibleToGender !== meRow.gender)
```
Wenn `meRow` undefined ist (theoretisch bei korrupter Session), crasht der Server mit `TypeError: Cannot read property 'gender' of undefined`.

### 16. Keine Nachrichtenlängen-Begrenzung
**Datei:** `backend/src/routes/messages.ts:8-56`
Nachrichten können beliebig lang sein. Kein `content.length`-Check.

### 17. Keine Email-Format-Validierung im Backend
**Datei:** `backend/src/routes/auth.ts:30`
Das Backend prüft nur `!email`, aber nicht ob es eine gültige Email ist. Strings wie `"abc"` werden akzeptiert.

---

## Architektur-Probleme

### 18. Hardcodierte URLs im Frontend
**Dateien:** `frontend/src/api/api.ts:6`, `LoginForm.tsx:20`, `RegisterForm.tsx:24`
```typescript
const BASE_URL = 'http://localhost:3000';
```
LoginForm und RegisterForm nutzen zudem nicht die zentrale `api.ts`, sondern rufen `axios.post('http://localhost:3000/...')` direkt auf. Die URL ist dreifach hardcodiert.

### 19. `match.ts` Route ist leer
**Datei:** `backend/src/routes/match.ts`
Enthält nur einen Kommentar (`//# Match-Anfragen`), wird aber nicht importiert. Toter Code.

### 20. Polling statt WebSockets
Inbox pollt alle 3 Sekunden, Chat pollt alle 3 Sekunden, Header pollt alle 5 Sekunden. Bei 100 gleichzeitigen Usern sind das ~50 HTTP-Requests/Sekunde allein fürs Polling.

### 21. Keine CORS-Konfiguration für Production
**Datei:** `backend/src/index.ts:18-21`
```typescript
origin: 'http://localhost:3001'
```
Nur für Entwicklung konfiguriert. In Production muss die Origin angepasst werden.

---

## Zusammenfassung nach Schweregrad

| Schweregrad | Anzahl | Dringendste |
|-------------|--------|-------------|
| **KRITISCH** | 3 | Session Secret `'1234'`, Auth-Bypass via localStorage, Debug-Endpoint ohne Auth |
| **HOCH** | 2 | Kaputte `markMessagesRead`-API, fehlende Rate-Limiting |
| **MITTEL** | 6 | Fehlende Validierungen, Schema-Tippfehler, inkonsistenter localStorage |
| **NIEDRIG** | 5 | Toter Code, hardcodierte URLs, fehlende Indizes, Polling-Architektur |

Die drei kritischen Probleme (#1, #2, #3) sollten vor einem Production-Deployment zwingend behoben werden.
