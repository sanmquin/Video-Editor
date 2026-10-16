import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Key,
  Sparkles,
  Server,
  HelpCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { getStoredClientId, setStoredClientId } from '../utils/googleAuth';

interface BuiltInDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'onboarding' | 'oauth' | 'gemini' | 'studio-vs-cloud' | 'troubleshooting';
}

export const BuiltInDocsModal: React.FC<BuiltInDocsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'onboarding'
}) => {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'oauth' | 'gemini' | 'studio-vs-cloud' | 'troubleshooting'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientIdInput, setClientIdInput] = useState<string>(() => getStoredClientId());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCode = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSaveClientId = () => {
    setStoredClientId(clientIdInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                Built-in StudioCut Documentation & Help Center
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Offline Ready
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Complete local guide for onboarding, Google OAuth 2.0, Gemini AI setup & troubleshooting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search */}
        <div className="px-6 py-2.5 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'onboarding'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1. First Workflow Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('oauth')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'oauth'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Google OAuth Setup</span>
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'gemini'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>3. AI Gemini Setup</span>
            </button>

            <button
              onClick={() => setActiveTab('studio-vs-cloud')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'studio-vs-cloud'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-sky-400" />
              <span>4. Local vs Cloud</span>
            </button>

            <button
              onClick={() => setActiveTab('troubleshooting')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'troubleshooting'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>5. Troubleshooting</span>
            </button>
          </div>

          <div className="relative w-52 hidden md:block">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Documentation Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed">

          {/* TAB 1: ONBOARDING & FIRST WORKFLOW GUIDE */}
          {activeTab === 'onboarding' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 p-5 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>The 3-Step First Workflow in StudioCut</span>
                </div>
                <p className="text-zinc-300">
                  StudioCut is optimized to make YouTube Shorts creation and viral hook optimization seamless. Follow this straightforward 3-step workflow to analyze metrics, clean transcripts, and extract high-retention hooks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step A */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    a
                  </div>
                  <h3 className="font-bold text-zinc-100 text-sm">Get Channel Metrics</h3>
                  <p className="text-zinc-400">
                    Connect your YouTube account using standard Google OAuth 2.0 to fetch real-time channel statistics:
                  </p>
                  <ul className="space-y-1.5 text-zinc-300 list-disc list-inside">
                    <li>Swipe Rate % (Stayed vs Swiped Away)</li>
                    <li>Retention % & Average View Duration</li>
                    <li>Views, Likes, Shares & Subscriber gains</li>
                    <li>First 4-second hook transcript JSON preview</li>
                  </ul>
                </div>

                {/* Step B */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                    b
                  </div>
                  <h3 className="font-bold text-zinc-100 text-sm">Get Video Transcripts</h3>
                  <p className="text-zinc-400">
                    Import WebVTT (`.vtt`) subtitle files exported from YouTube or editing software:
                  </p>
                  <ul className="space-y-1.5 text-zinc-300 list-disc list-inside">
                    <li>LLM cleans raw captions into fluent narrative text</li>
                    <li>Splits video into 10 consistent topic segments</li>
                    <li>Maintains exact timestamp boundaries for video clipping</li>
                  </ul>
                </div>

                {/* Step C */}
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    c
                  </div>
                  <h3 className="font-bold text-zinc-100 text-sm">Select Segment Hooks</h3>
                  <p className="text-zinc-400">
                    Analyze top 10 YouTube Shorts retention patterns and generate punchy hooks:
                  </p>
                  <ul className="space-y-1.5 text-zinc-300 list-disc list-inside">
                    <li>Contiguous word trimming to maximize punchiness</li>
                    <li>Scores hooks on a 0-100 retention impact scale</li>
                    <li>Processes local video clip with 5-second margins before/after</li>
                  </ul>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Transitioning to Full Local Studio Mode
                </h4>
                <p className="text-zinc-400">
                  When you have selected your hooks or wish to perform advanced multi-track editing, click "Studio Workspace" in the header navbar to access timeline multi-track editing, inspector keyframing, and video viewport controls.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE OAUTH & YOUTUBE API SETUP */}
          {activeTab === 'oauth' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-2xl flex items-start space-x-3 text-amber-200">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-zinc-100">Standard Google OAuth 2.0 Best Practices</h3>
                  <p className="text-xs text-amber-200/90">
                    StudioCut uses standard OAuth 2.0 authorization endpoints. We never ask for password entry or manual token pasting. Authentication happens directly via official Google consent popups/redirects.
                  </p>
                </div>
              </div>

              {/* In-App Client ID Configuration */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      Configure Your Local Google Client ID
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Enter your own Google Cloud OAuth Client ID to connect directly to your YouTube Data API project.
                    </p>
                  </div>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Client ID Saved
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="e.g. 1234567890-xxx.apps.googleusercontent.com"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveClientId}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors text-xs shrink-0"
                  >
                    Save Local Client ID
                  </button>
                </div>
              </div>

              {/* Step-by-Step Google Cloud Console Instructions */}
              <div className="space-y-4">
                <h3 className="font-bold text-zinc-100 text-sm">How to Create Your OAuth 2.0 Client ID in Google Cloud</h3>

                <div className="space-y-3 font-sans">
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <span className="font-mono text-indigo-400 font-bold">Step 1: Create Project in Google Cloud Console</span>
                    <p className="text-zinc-300">
                      Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-1">console.cloud.google.com <ExternalLink className="w-3 h-3" /></a>, create a new project named <strong>"StudioCut Local Studio"</strong>.
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <span className="font-mono text-indigo-400 font-bold">Step 2: Enable YouTube Data API v3</span>
                    <p className="text-zinc-300">
                      Navigate to <strong>APIs & Services &gt; Library</strong>, search for <strong>YouTube Data API v3</strong>, and click <strong>Enable</strong>.
                    </p>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <span className="font-mono text-indigo-400 font-bold">Step 3: Configure OAuth Consent Screen & Scopes</span>
                    <p className="text-zinc-300">
                      Under <strong>APIs & Services &gt; OAuth consent screen</strong>, select User Type: <strong>External</strong> or <strong>Testing</strong>. Add test users (your Google account email) and select scope:
                    </p>
                    <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 font-mono text-emerald-400 flex items-center justify-between">
                      <span>https://www.googleapis.com/auth/youtube.readonly</span>
                      <button
                        onClick={() => handleCopyCode('https://www.googleapis.com/auth/youtube.readonly', 'scope')}
                        className="text-zinc-400 hover:text-zinc-200 p-1"
                        title="Copy scope"
                      >
                        {copiedCode === 'scope' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <span className="font-mono text-indigo-400 font-bold">Step 4: Create OAuth 2.0 Credentials</span>
                    <p className="text-zinc-300">
                      Go to <strong>APIs & Services &gt; Credentials &gt; Create Credentials &gt; OAuth Client ID</strong>. Choose Application Type: <strong>Web Application</strong>.
                    </p>
                    <div className="space-y-1 pt-1">
                      <p className="text-zinc-400">Set <strong>Authorized JavaScript origins</strong>:</p>
                      <code className="block bg-zinc-900 p-2 rounded text-indigo-300 font-mono">http://localhost:5173</code>
                      <code className="block bg-zinc-900 p-2 rounded text-indigo-300 font-mono">http://localhost:3000</code>
                    </div>
                    <div className="space-y-1 pt-1">
                      <p className="text-zinc-400">Set <strong>Authorized redirect URIs</strong>:</p>
                      <code className="block bg-zinc-900 p-2 rounded text-indigo-300 font-mono">http://localhost:5173/</code>
                      <code className="block bg-zinc-900 p-2 rounded text-indigo-300 font-mono">http://localhost:3000/</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI HOOK FINDER & GEMINI SETUP */}
          {activeTab === 'gemini' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 p-5 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-purple-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Gemini 3.1 Flash Lite Hook Generation</span>
                </div>
                <p className="text-zinc-300">
                  StudioCut leverages Gemini 3.1 Flash Lite to split transcripts into 10 message segments, analyze YouTube Shorts retention trends, and trim contiguous words to create high-retention video hooks.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  Setting Your Gemini API Key (`GEMINI_API_KEY`)
                </h3>
                <p className="text-zinc-400">
                  Create a `.env` file in the root directory of your local StudioCut project:
                </p>

                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 font-mono text-purple-300 flex items-center justify-between">
                  <span>GEMINI_API_KEY=your_gemini_api_key_here</span>
                  <button
                    onClick={() => handleCopyCode('GEMINI_API_KEY=your_gemini_api_key_here', 'env')}
                    className="text-zinc-400 hover:text-zinc-200 p-1"
                  >
                    {copiedCode === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg text-emerald-300 text-xs">
                  <span className="font-semibold">Automatic Rule-Based Fallback Mode: </span>
                  If no Gemini API key is configured in `.env`, StudioCut automatically falls back to an intelligent built-in rule-based NLP algorithm, allowing you to test full hook generation and video clipping offline with zero API setup!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-indigo-400 text-xs">Contiguous Word Trimming</h4>
                  <p className="text-zinc-300">
                    To make speech punchy without sounding robotic, the AI trims contiguous word sequences at the sentence boundaries while preserving core semantic meaning.
                  </p>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-emerald-400 text-xs">5-Second Margin Video Clipping</h4>
                  <p className="text-zinc-300">
                    When clipping local video files, StudioCut automatically includes 5 seconds of footage before the hook start time and 5 seconds after the hook end time to ensure natural transitions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCAL STUDIO VS CLOUD VERSION */}
          {activeTab === 'studio-vs-cloud' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  Local Studio vs. Cloud Version Feature Matrix
                </h3>
                <p className="text-zinc-400">
                  StudioCut runs as a local high-performance desktop studio web app, while also offering a lightweight cloud version.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-semibold">
                    <tr>
                      <th className="p-3">Feature</th>
                      <th className="p-3 text-indigo-400">Local Studio (This App)</th>
                      <th className="p-3 text-zinc-400">Cloud Web Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-sans">
                    <tr>
                      <td className="p-3 font-medium text-zinc-100">Video Processing</td>
                      <td className="p-3 text-emerald-400 font-semibold">100% Local Canvas & MediaRecorder (Unlimited size)</td>
                      <td className="p-3 text-zinc-400">Browser/Server Upload Limits (Max 50MB)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-zinc-100">YouTube Analytics & Metrics</td>
                      <td className="p-3 text-emerald-400 font-semibold">Full API + CSV Export + 0-4s Hook JSON</td>
                      <td className="p-3 text-zinc-400">Read-only Analytics Summary</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-zinc-100">Google OAuth 2.0 Security</td>
                      <td className="p-3 text-emerald-400 font-semibold">Direct Google Login to standard endpoints</td>
                      <td className="p-3 text-zinc-400">Proxy OAuth Server required</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-zinc-100">AI Hook Generation</td>
                      <td className="p-3 text-emerald-400 font-semibold">Gemini 3.1 Flash Lite + Offline Rule-based fallback</td>
                      <td className="p-3 text-zinc-400">Cloud API Quota limited</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-zinc-100">Data Privacy & Security</td>
                      <td className="p-3 text-emerald-400 font-semibold">Videos & transcripts never leave your machine</td>
                      <td className="p-3 text-zinc-400">Processed through cloud servers</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: TROUBLESHOOTING & FAQS */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-6 max-w-4xl">
              <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-2xl flex items-start space-x-3 text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-zinc-100">Local Troubleshooting Guide</h3>
                  <p className="text-xs text-rose-200/90">
                    Below are common errors and quick solutions when running StudioCut locally.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs">Q: Google OAuth returns "Error 400: origin_mismatch"</h4>
                  <p className="text-zinc-300">
                    <strong>Solution:</strong> Open Google Cloud Console &gt; Credentials &gt; OAuth Client ID. Add <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">http://localhost:5173</code> to "Authorized JavaScript origins" and "Authorized redirect URIs".
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs">Q: How do I change the standalone server port?</h4>
                  <p className="text-zinc-300">
                    <strong>Solution:</strong> Set the <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">PORT</code> environment variable when starting: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">PORT=4000 npm start</code>.
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs">Q: Why does the VTT upload fail or format incorrectly?</h4>
                  <p className="text-zinc-300">
                    <strong>Solution:</strong> Ensure your subtitle file starts with the header <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">WEBVTT</code> and uses standard timestamp arrows (<code className="bg-zinc-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">00:00.000 --&gt; 00:04.000</code>).
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs">Q: OAuth access token expired error</h4>
                  <p className="text-zinc-300">
                    <strong>Solution:</strong> Google OAuth tokens expire after 60 minutes. Click "Sign Out" or "Authenticate Google" in the app header/analytics modal to obtain a fresh token.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Built-in Documentation active (Version 1.0.0)
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
          >
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  );
};
