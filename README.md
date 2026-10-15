# StudioCut — AI Video Editor & Hook Finder

StudioCut is a React + TypeScript video editor and analytics application with an **AI Hook Finder** (powered by Gemini 3.1 Flash Lite) and **YouTube Shorts Analytics** with swipe rate and retention tracking.

The application runs completely **standalone without any Netlify platform dependencies**, using integrated Vite dev/preview middleware and a lightweight Node server.

---

## 🚀 Quick Start (Running Without Netlify)

Follow these simple steps to set up and run the application locally:

### Step 1: Prerequisites
Ensure you have **Node.js (v18 or higher)** and `npm` installed:
```bash
node -v
npm -v
```

### Step 2: Install Dependencies
Clone the repository and install all npm dependencies:
```bash
npm install
```

### Step 3: Set Up Environment Variables (Optional)
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for AI Hook Finder | Built-in rule-based algorithm fallback if omitted |
| `YOUTUBE_CLIENT_ID` | OAuth 2.0 Client ID for YouTube Analytics | Realistic demo dataset mode if omitted |
| `YOUTUBE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Optional |
| `YOUTUBE_REDIRECT_URI` | OAuth 2.0 Redirect URI | `http://localhost:5173/auth/callback` |
| `PORT` | Standalone server port | `3000` |

*Note: StudioCut includes realistic fallback demo datasets for both Gemini and YouTube Analytics, so you can run and test the app immediately without any API keys!*

### Step 4: Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Running in Production Mode (No Netlify Required)

### Option A: Standalone Node Server
Build the frontend bundle and run the Node server (`server.mjs`):
```bash
npm run build
npm start
```
The server will start at [http://localhost:3000](http://localhost:3000) (or your configured `PORT`), serving built static assets from `dist/` and providing API endpoints (`/api/*`).

### Option B: Vite Preview Server
Alternatively, use Vite's built-in preview server:
```bash
npm run build
npm run preview
```
This runs the production bundle with API middleware at [http://localhost:4173](http://localhost:4173).

---

## 🛠️ Available npm Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts Vite dev server with HMR and API middleware |
| `npm run build` | `tsc -b && vite build` | Type-checks TypeScript and compiles static build to `dist/` |
| `npm run start` | `node server.mjs` | Runs standalone Node server serving `dist/` and `/api/*` |
| `npm run preview` | `vite preview` | Previews production build using Vite with API middleware |
| `npm run lint` | `oxlint` | Runs Oxlint linter on codebase |

---

## 📡 API Architecture & Endpoints

All API endpoints are served via standard `/api/` paths (with fallback backward compatibility for `/.netlify/functions/`):

- **`/api/find-hooks`**: Process `.vtt` transcripts, analyze top 10 YouTube Shorts hooks, and generate AI hook suggestions with contiguous word trimming.
- **`/api/youtube-analytics`**: Retrieve YouTube Shorts analytics (swipe rate, retention %, views, likes, shares, and 0–4s transcript hooks) in JSON or CSV export formats.

---

## 📚 Feature Documentation

For detailed architecture and advanced setups, refer to:

- 🪄 **[GEMINI_HOOKS_SETUP.md](./GEMINI_HOOKS_SETUP.md)**: AI Hook Finder workflow documentation (Gemini 3.1 Flash Lite, 10-segment transcript splitting, contiguous word trimming, and 5-second margin video clipping).
- 📊 **[YOUTUBE_API_SETUP.md](./YOUTUBE_API_SETUP.md)**: Google Cloud setup guide for YouTube Data & Analytics API integration, OAuth scopes, and CSV exports.
