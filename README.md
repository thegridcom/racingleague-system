# the grid. - racing league 🏎️🏁
> **Modulare, rechtssichere Simracing-Plattform & Discord-Bot für Formel-1- und Motorsport-Ligen**  
> *Entwickelt mit Node.js, TypeScript, Express, discord.js (v14+) und Prisma ORM.*

---

## 📋 Überblick & Highlights

**the grid. - racing league** ist eine schlüsselfertige, hochmoderne Web-Plattform mit integriertem Discord-Bot, konzipiert für anspruchsvolle private Simracing-Communitys.

- 🛡️ **DSGVO & Rechtssicherheit (Deutschland):**
  - **Art. 17 DSGVO Self-Service Account-Löschung:** Fahrer können ihren Account und alle personenbezogenen Daten im Cockpit per Danger-Zone mit doppelter Bestätigung eigenständig und unwiderruflich löschen. Historische Rennergebnisse bleiben zur Wahrung der Meisterschaftsintegrität erhalten, werden jedoch vollständig anonymisiert (`driverName` = *"Gelöschter Fahrer (anonymisiert)"*, Verknüpfung via Foreign-Key `ON DELETE SET NULL`).
  - **100% Tracker-Frei:** Keine Cookies an Dritte, kein Google Analytics, kein Werbetracking – daher **kein störender Cookie-Consent-Banner erforderlich**.
  - **Impressum (§ 5 DDG) & Datenschutzerklärung (Art. 13 ff. DSGVO):** Rechtssicher ausformuliert.
  - **Markenrechtlicher Disclaimer:** Vollständige, permanente Distanzierung von der Formula One Group, EA Sports, Codemasters und der FIA im Footer aller Seiten sowie in Discord-Embeds.
- 🎨 **Kompromissloses Motorsport-Design (Kein "KI-Slop"):**
  - Tiefes Asphalt-Schwarz (`#0B0E14`), edles Anthrazit (`#151921`) für Cards, scharfe Kontraste mit purem Weiß (`#F8FAFC`).
  - Subtiles Racing-Rot (`#E10600`) als Signal- und Highlight-Farbe.
  - Monospace-Ziffern (`font-mono`) für Rundenzeiten, Startnummern und Meisterschaftspunkte.
  - Formel-1-inspiriertes Timing-Tower-Leaderboard und offizielle Startnummern-Badges.
- 🤖 **Discord-Bot Integration (discord.js v14):**
  - **Live-Tabelle (`#rangliste`):** Bot pflegt eine persistente Nachricht, die bei Ergebnis-Updates im Web-Dashboard automatisch in Echtzeit editiert wird.
  - **Renntag-Check-In:** Bot postet vor dem Rennen ein Embed mit Buttons: `[🟢 Bin dabei]`, `[🔴 Kann nicht]`, `[🟡 Reserve / Unsicher]`. Klicks aktualisieren die Datenbank und passen die Teilnehmerzahlen live im Embed an.
  - **Slash-Commands:** `/next-race`, `/standings`, `/standings-setup`, `/checkin-setup`.
- 🏆 **Meisterschafts- & Admin-Engine:**
  - Offizielles FIA Formel-1-Punkteschema (25, 18, 15, 12, 10, 8, 6, 4, 2, 1) + 1 Bonuspunkt für die schnellste Rennrunde (bei Finish in den Top 10).
  - Team-Management: 10 F1-Teams mit Farbcodes und exakt maximal 2 Stammfahrern pro Team.
  - Schnellerfassung für Rennergebnisse (Plätze 1–20, DNF, DSQ, DNS, Strafpunkte, Fastest Lap).
  - Maschinenlesbarer CSV- und JSON-Export für Tabellen und Anwesenheitslisten.

---

## 🏛️ Architektur & Ordnerstruktur

Das Projekt folgt einer strikten **Domain-Driven Feature-Folder-Architektur**:

```text
thegridracing/
├── prisma/
│   ├── schema.prisma       # Prisma Schema (User, Team, Season, Race, Attendance, RaceResult)
│   └── seed.ts             # Initialer Seed (10 F1 Teams, Saison 1, Kalender, Test-Fahrer)
├── src/
│   ├── core/               # Infrastruktur, Config, DB-Singleton & Middlewares
│   │   ├── config.ts       # Typisierte Umgebungsvariablen & Disclaimer
│   │   ├── db.ts           # Prisma Client Instanz & Graceful Disconnect
│   │   ├── types.ts        # TypeScript Typen & Session-Erweiterungen
│   │   └── middleware/
│   │       ├── auth.ts     # isAuthenticated, isAdmin, requireOnboarding, attachUser
│   │       └── dsgvo.ts    # Sicherheits-Header & Disclaimer-Injection
│   ├── modules/            # Feature-Module (Domain-Driven)
│   │   ├── auth/           # Discord OAuth2, Token-Exchange, Dev-Login
│   │   ├── drivers/        # Onboarding, Profil, Art. 17 DSGVO Account-Löschung
│   │   ├── seasons/        # Saisonverwaltung, Rennkalender & Streckendetails
│   │   ├── results/        # F1-Punkteberechnung, Standings-Engine (Fahrer & Teams)
│   │   ├── attendance/     # An-/Abmelde-Logik für Renntage
│   │   ├── admin/          # Admin-Panel, Team-Zuweisung, Schnellerfassung
│   │   └── legal/          # Impressum, Datenschutzerklärung, Disclaimer
│   ├── bot/                # discord.js v14 Bot-Client
│   │   ├── bot.ts          # Bot Lifecycle, Event-Handler & Live-Message Updater
│   │   ├── embeds.ts       # Embed-Templates für Rangliste & Check-In
│   │   ├── commands/       # Slash-Commands (/next-race, /standings, /setup)
│   │   └── buttons/        # Button-Handler für Renn-Check-In
│   ├── views/              # EJS Templates mit Motorsport Tailwind Design
│   │   ├── partials/       # Header, Navbar, Footer (mit Disclaimer), Flash-Messages
│   │   ├── home/           # Startseite mit Hero, Nächstes Rennen & Timing Tower
│   │   ├── auth/           # Login-Seite mit Discord OAuth2 & Dev Switcher
│   │   ├── drivers/        # Onboarding, Cockpit & Fahrerfeld
│   │   ├── seasons/        # Rennkalender & Renndetails mit Check-In
│   │   ├── results/        # WM-Tabellenstände mit CSV/JSON Export
│   │   ├── admin/          # Admin Dashboard, Teams, Saisons & Ergebniseingabe
│   │   └── legal/          # Impressum & Datenschutzerklärung
│   └── index.ts            # Server Entry Point & Lifecycle
├── .env.example            # Konfigurationsvorlage
├── package.json            # Scripts & Abhängigkeiten
├── tsconfig.json           # TypeScript Konfiguration
└── README.md               # Dokumentation & Setup-Anleitung
```

---

## 🚀 Schnellstart & Lokale Installation

### Voraussetzungen
- **Node.js:** v18.0.0 oder höher (getestet auf v22 / v23)
- **npm:** v9 oder höher

### 1. Repository klonen & Abhängigkeiten installieren
```bash
cd thegridracing
npm install
```

### 2. Umgebungsvariablen anlegen
Kopiere `.env.example` nach `.env`:
```bash
cp .env.example .env
```

> **Hinweis zum Sofort-Testen:**  
> Standardmäßig ist `DEV_LOGIN_ENABLED=true` gesetzt. Du kannst die Plattform **sofort lokal starten und alle Funktionen (inkl. Admin-Panel, Cockpit und DSGVO-Löschung) testen**, ohne vorab eine Discord-Anwendung erstellen zu müssen!

### 3. Datenbank initialisieren & Seeden
Erstellt die SQLite-Datenbank und lädt die 10 offiziellen Teams, die Meisterschaftssaison 2026, Streckenkalender und Test-Fahrer:
```bash
npm run prisma:push
npm run seed
```

### 4. Server starten
```bash
# Entwicklungsmodus mit Hot-Reload:
npm run dev

# Oder für Produktion kompilieren & starten:
npm run build
npm run start
```
Die Plattform ist nun erreichbar unter: **[http://localhost:8422](http://localhost:8422)**

---

## ⚙️ Discord-Bot & OAuth2 Einrichtung

Folge dieser Anleitung, um deinen echten Discord-Bot und Login anzubinden:

### 1. Discord Developer Application erstellen
1. Öffne das [Discord Developer Portal](https://discord.com/developers/applications).
2. Klicke auf **"New Application"** und gib ihr den Namen `the grid. racing`.
3. Notiere dir die **Application ID** (in `.env` als `DISCORD_CLIENT_ID`).

### 2. OAuth2 konfigurieren
1. Gehe im Menü links auf **OAuth2** -> **General**.
2. Klicke auf **"Reset Secret"**, kopiere das Secret in deine `.env` als `DISCORD_CLIENT_SECRET`.
3. Klicke auf **"Add Redirect"** und trage ein:
   ```text
   http://localhost:8422/auth/discord/callback
   ```
   *(Für Produktivserver: `https://deine-domain.de/auth/discord/callback`)*
4. Klicke unten auf **"Save Changes"**.

### 3. Bot-User erstellen & Token generieren
1. Gehe links auf **Bot**.
2. Klicke auf **"Add Bot"** bzw. **"Reset Token"**.
3. Kopiere das Token in deine `.env` als `DISCORD_BOT_TOKEN`.
4. Scrolle herunter zu **"Privileged Gateway Intents"** und aktiviere:
   - ✅ **Server Members Intent** (zur Rollenprüfung Stammfahrer/Admin)
   - ✅ **Message Content Intent**
5. Speichere die Änderungen.

### 4. Bot auf deinen Server einladen
1. Gehe links auf **OAuth2** -> **URL Generator**.
2. Wähle Scopes:
   - `bot`
   - `applications.commands`
3. Wähle Bot-Berechtigungen (Permissions):
   - `Send Messages`
   - `Embed Links`
   - `Attach Files`
   - `Read Message History`
   - `Use Slash Commands`
4. Kopiere die generierte URL, öffne sie im Browser und lade den Bot auf deinen Discord-Server ein.

### 5. Server- & Rollen-IDs eintragen
Aktiviere in Discord die Entwickleroptionen (*Benutzereinstellungen -> Erweitert -> Entwicklermodus*).
- Klicke mit der rechten Maustaste auf deinen Server -> **Server-ID kopieren** -> `DISCORD_GUILD_ID`
- Gehe in die Servereinstellungen -> Rollen -> Admin-Rolle(n) rechtsklicken -> **Rollen-ID kopieren** -> `ADMIN_ROLE_IDS=1549347126398685304,1544650644747714630` (mehrere IDs durch Komma getrennt)
- Trage die Kanal-IDs für `#rangliste` (`DISCORD_STANDINGS_CHANNEL_ID`) und Check-Ins (`DISCORD_CHECKIN_CHANNEL_ID`) ein.

---

## 🤖 Discord Slash-Commands & Bot-Nutzung

| Befehl | Berechtigung | Beschreibung |
| :--- | :--- | :--- |
| `/next-race` | Jeder | Zeigt Details zum nächsten anstehenden Grand Prix inkl. Check-In Status. |
| `/standings` | Jeder | Zeigt eine Übersicht der aktuellen Fahrer- & Konstrukteurswertung im Chat. |
| `/standings-setup` | **Administrator** | Postet das offizielle Live-Ranglisten-Embed in den aktuellen Kanal (`#rangliste`). Der Bot merkt sich diese Nachricht und **editiert sie bei jedem Rennergebnis im Web-Dashboard vollautomatisch**! |
| `/checkin-setup [runde]` | **Administrator** | Postet das interaktive Check-In-Embed mit den Buttons `[🟢 Bin dabei]`, `[🔴 Kann nicht]`, `[🟡 Reserve]` in den Renntag-Kanal. |

---

## 🛡️ Datenschutz (DSGVO) & Technische Umsetzung

### Art. 17 DSGVO Self-Service Account-Löschung
1. Jeder angemeldete Fahrer findet am Ende seines Cockpits (`/driver/dashboard`) die **Gefahrenzone**.
2. Klick auf *"Account löschen..."* öffnet einen Bestätigungs-Modal.
3. Der Fahrer muss zur doppelten Bestätigung das Sicherheitswort **`LÖSCHEN`** eintippen.
4. **Server-Transaktion (`prisma.$transaction`):**
   - In `RaceResult` werden alle Verknüpfungen zur `userId` via `SET NULL` aufgehoben und der `driverName` zu `"Gelöschter Fahrer (anonymisiert)"` geändert.
   - Alle Anwesenheitsdaten (`Attendance`) des Users werden gelöscht.
   - Der `User`-Account wird physisch aus der Datenbank gelöscht.
   - Die Session wird zerstört und das Cookie invalidiert.
   - Der User wird auf `/?deleted=true` weitergeleitet.

### Tracker-Freiheit
- Die Anwendung benötigt **keinen Cookie-Banner nach TTDSG/TDDDG**, da ausschließlich ein technisch zwingend erforderlicher First-Party Session-Cookie (`connect.sid`, `HttpOnly`, `SameSite=Lax`) verwendet wird.

---

## 🗄️ Datenbankwechsel (PostgreSQL für Produktion)

Standardmäßig nutzt das Projekt SQLite (`file:./dev.db`). Für eine Produktionsumgebung auf PostgreSQL (z. B. auf Railway, Supabase oder Render):

1. Passe in `prisma/schema.prisma` den Provider an:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Setze in deiner Produktionsumgebung `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/thegrid?schema=public"
   ```
3. Führe `npm run prisma:push` aus.

---

## 🚀 Produktion-Deployment (Linux, PM2 & Nginx Reverse Proxy)

Das Projekt ist vollständig für den Produktivbetrieb auf einem Linux-Server (Ubuntu / Debian) hinter einem Nginx Reverse Proxy vorbereitet:

### 1. PM2 Prozessmanager Setup
1. Kompiliere das Projekt:
   ```bash
   npm run build
   ```
2. Starte die Anwendung mit der beiliegenden `ecosystem.config.js`:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```
   > **Wichtig:** Die Anwendung läuft in PM2 im `fork`-Modus mit 1 Instanz, damit der Discord-Bot keine doppelten Gateway-Verbindungen aufbaut.

### 2. Nginx Reverse-Proxy Konfiguration
Kopiere die Vorlage aus `nginx/thegridracing.conf` in deine Nginx-Konfiguration:
```bash
sudo cp nginx/thegridracing.conf /etc/nginx/sites-available/thegridracing.conf
sudo ln -s /etc/nginx/sites-available/thegridracing.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```
* **Trust Proxy aktiviert:** Express ist vorkonfiguriert mit `app.set('trust proxy', 1)` und `proxy: true` bei den Sessions. Dadurch werden Client-IPs (`X-Forwarded-For`) und HTTPS-Zustände (`X-Forwarded-Proto`) von Nginx korrekt an die Anwendung weitergereicht.
* **WebSocket-Unterstützung:** Nginx leitet Upgrades für Discord-WebSockets und Event-Streams unterbrechungsfrei weiter.

---

## 🌐 Überprojekt-Integration: thegridcom.org
*the grid. - racing league* ist als eigenständige Motorsport-Division Teil des übergeordneten Community-Netzwerks **[thegridcom.org](https://thegridcom.org)**:
- Direkte Verlinkung im Header/Navbar (`Part of thegridcom.org`).
- Prominente Repräsentation im mobilen Menü und im Footer.

---

## 📜 Markenrechtlicher Pflicht-Disclaimer

> *"the grid. - racing league ist eine reine private Freizeit-Community ohne kommerzielle Absichten. Diese Plattform und Community stehen in keiner geschäftlichen oder offiziellen Verbindung zur Formula One Group, Electronic Arts Inc., Codemasters oder der FIA. 'F1', 'FORMULA 1' sowie alle Team- und Markennamen sind geschützte Marken der jeweiligen Rechteinhaber und werden hier ausschließlich zu Beschreibungs- und Zuordnungszwecken im Rahmen privater Gaming-Lobbys genutzt."*

