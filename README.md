# FaidaPlus - Business Management System

FaidaPlus ni mfumo madhubuti wa usimamizi wa biashara ndogo na za kati (SMEs) nchini Afrika Mashariki, ulioundwa kwa kutumia **React 19 (Vite)** na **Node.js (Express) na SQLite**.

---

## 📌 Jinsi ya Kuiendesha Kwenye Kompyuta Yako (Local Setup Guide)

Maudhui na muundo wa mfumo huu umepangwa kwa urahisi sana. Mteja (Frontend) yupo kwenye mzizi wa mradi (root folder), na huduma ya nyuma (Backend Server) ipo ndani ya folda la `/server`.

Huna haja ya kwenda kwenye folda tofauti tofauti kufanya `npm install` na kuanzisha servers mbili tofauti! Unaweza kufanya kila kitu kutoka kwenye mzizi wa mradi kwa urahisi sana.

### Hatua ya 1: Pakua au Clone Mradi
Hakikisha umepakua ZIP ya mradi huu kutoka AI Studio au umefanya clone kutoka GitHub kwenda kwenye kompyuta yako:
```bash
git clone <your-github-repo-url>
cd faidaplus
```

### Hatua ya 2: Weka Mafaili ya Mazingira (.env)
1. Kwenye **mzizi wa mradi (root directory)**, nakili faili la `.env.example` na ulizipe jina jipya la `.env`:
   ```bash
   cp .env.example .env
   ```
2. Kwenye folda la **`/server`**, nakili faili la `.env.example` na ulipe jina la `.env`:
   ```bash
   cp server/.env.example server/.env
   ```
*(Unaweza kufungua mafaili haya ya `.env` na kubadilisha siri kama `JWT_SECRET` au `PORT` kama utapenda).*

### Hatua ya 3: Weka Maktaba Zote (Install Dependencies)
Kutoka kwenye **mzizi wa mradi (root directory)**, endesha amri ifuatayo ili kuweka maktaba zote za Frontend na Backend kwa pamoja:
```bash
npm install
```

### Hatua ya 4: Washa Mfumo (Run Development Server)
Ili kuwasha mteja (React/Vite) na server (Express/SQLite) kwa wakati mmoja, endesha amri hii kwenye **mzizi wa mradi (root directory)**:
```bash
npm run dev
```

Mfumo utajiwasha wenyewe kwa kutumia `concurrently`:
* **Frontend (Mteja)** itakuwa inapatikana kwenye: **[http://localhost:3000](http://localhost:3000)**
* **Backend API** itakuwa inajiwasha kwenye port `5000` (na itatengeneza database ya SQLite `faidaplus.db` kiotomatiki kama haipo).
* Maombi yote ya `/api` kutoka kwenye mteja yataelekezwa (proxied) kwenda kwenye server ya Express kiotomatiki.

---

## 📂 Muundo wa Mradi (Project Structure)

```
faidaplus/
├── src/                    # React Frontend (Mteja)
│   ├── components/         # Vipengele vinavyotumika mara kwa mara (Layout, Dialogs)
│   ├── pages/              # Kurasa kuu (Dashboard, Transactions, Reports, nk)
│   ├── context/            # Lugha (Swahili/English), Theme, Auth, na Data Sync
│   ├── utils/              # Zana za usaidizi (Formatting, nk)
│   ├── App.jsx             # Njia na mpangilio mkuu wa React
│   └── main.jsx            # Mahali pa kuanzia React
├── server/                 # Node.js Backend Server
│   ├── db/                 # Uhusiano na SQLite na schema (`schema.sql`)
│   ├── routes/             # Njia zote za API za mfumo (Auth, Transactions, nk)
│   ├── controllers/        # Mantiki ya kila njia ya API
│   ├── middleware/         # Ulinzi na uthibitisho wa watumiaji (Auth Middleware)
│   ├── cron/               # Kazi zinazojiendesha zenyewe kwa muda maalum (Alerts)
│   └── server.js           # Faili kuu la kuanzisha server ya Express
├── package.json            # Scripts na dependencies zote za mradi
└── README.md               # Mwongozo huu wa matumizi
```

---

## 🚀 Uendeshaji wa Uzalishaji (Production Deployment)

Ikiwa unataka kuiweka kwenye server halisi au uzalishaji:

1. **Jenga Faili za Tuli za Frontend (Build Client):**
   ```bash
   npm run build
   ```
   Hii itatengeneza folda la `/dist` lenye faili zote zilizoboreshwa.

2. **Washa Server ya Uzalishaji:**
   Hakikisha kuwa folda la `server/.env` lina `NODE_ENV=production`. Kisha washa server:
   ```bash
   npm start
   ```
   Katika mazingira ya uzalishaji (`production`), server ya Express itahudumia faili zote tuli za mteja kutoka folda la `/dist` na kutoa API zote kutoka kwenye port moja (`3000`), jambo linalofanya iwe thabiti na salama sana!

---

## English Quick Start

1. **Clone & Navigate**:
   ```bash
   git clone <repository-url>
   cd faidaplus
   ```
2. **Environment Variables**:
   Copy `.env.example` to `.env` at the root, and `server/.env.example` to `server/.env`.
3. **Install Dependencies**:
   Run `npm install` at the root.
4. **Run Dev Server**:
   Run `npm run dev` at the root. Access the app at **[http://localhost:3000](http://localhost:3000)**.
5. **Build for Production**:
   Run `npm run build` to compile the React assets, and then `npm start` to run the Express production server.
