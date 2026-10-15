# YouTube API Setup & Configuration Guide

This guide details the complete setup required to connect your Google / YouTube account with StudioCut for fetching key video analytics metrics (swipe rate, retention, likes, comments, shares) and automatic transcript extraction.

---

## 1. Overview & Required Scopes

To retrieve video performance metrics and captions/transcripts for videos (or the latest 10 short videos), the following OAuth 2.0 scopes must be configured:

| Scope URL | Purpose |
| :--- | :--- |
| `https://www.googleapis.com/auth/youtube.readonly` | View YouTube channel uploads and video details |
| `https://www.googleapis.com/auth/yt-analytics.readonly` | View YouTube Analytics reports (retention, engaged views, subscriber changes) |
| `https://www.googleapis.com/auth/youtube.force-ssl` | Grant permissions to read captions, closed captions, and transcripts for videos |

---

## 2. Google Cloud Console Configuration

### Step 1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **StudioCut Analytics** or select an existing project.

### Step 2: Enable Required APIs
In the API Library (`APIs & Services` -> `Library`), search for and enable the following APIs:
1. **YouTube Data API v3**
2. **YouTube Analytics API**

### Step 3: Configure OAuth Consent Screen
1. Go to `APIs & Services` -> `OAuth consent screen`.
2. Select User Type (**External** for public users or **Internal** for Workspace organization).
3. Set Application Name to `StudioCut` and fill in support email details.
4. Under **Scopes for Google APIs**, add:
   - `.../auth/youtube.readonly`
   - `.../auth/yt-analytics.readonly`
   - `.../auth/youtube.force-ssl`
5. Under **Test Users**, add the Google email address associated with your YouTube channel.

### Step 4: Create OAuth 2.0 Credentials
1. Go to `APIs & Services` -> `Credentials`.
2. Click **Create Credentials** -> **OAuth client ID**.
3. Select Application type: **Web application**.
4. Set Authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - `https://your-domain.netlify.app` (for production)
5. Set Authorized redirect URIs:
   - `http://localhost:5173/auth/callback`
   - `https://your-domain.netlify.app/auth/callback`
6. Save your **Client ID** and **Client Secret**.

---

## 3. Environment Variables

Store these secrets securely in your environment variables (e.g., in `.env` or Netlify Site Configuration):

```env
YOUTUBE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:5173/auth/callback
```

---

## 4. How Transcript & Captions Permissions Work

1. **Owner vs Third-Party Captions**:
   - The `https://www.googleapis.com/auth/youtube.force-ssl` scope is required to download official caption tracks for videos owned by the authenticated channel.
2. **Custom VTT Upload Fallback**:
   - For videos where auto-generated YouTube captions are unavailable or restricted by region, StudioCut provides direct WebVTT (`.vtt`) file upload support in the Analytics modal. StudioCut automatically parses `.vtt` uploads, cleans the text, and extracts the 0s-4s timestamped hook array.

---

## 5. API Endpoint Examples

### Fetch Latest Uploads Playlist ID
```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://www.googleapis.com/youtube/v3/channels?mine=true&part=contentDetails"
```

### Fetch Video Analytics via StudioCut Function Endpoint
```bash
# Get JSON formatted metrics with 0-4s transcript hooks
curl -H "Authorization: Bearer demo_token" \
  "http://localhost:5173/.netlify/functions/youtube-analytics?format=json&shortsOnly=true&limit=10"

# Download CSV Export
curl -H "Authorization: Bearer demo_token" \
  "http://localhost:5173/.netlify/functions/youtube-analytics?format=csv" -o analytics.csv
```
