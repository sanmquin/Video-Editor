import React, { useState, useRef } from 'react';
import {
  BarChart2,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  LogIn,
  LogOut,
  Upload,
  Clock,
  Scissors,
  ChevronRight,
  RefreshCw,
  Video,
  Download,
  ShieldCheck
} from 'lucide-react';
import {
  initiateGoogleOAuthLogin,
  clearStoredToken,
  getTokenAuthInfo,
  type YouTubeUserProfile
} from '../utils/googleAuth';
import {
  processVttContent,
  analyzeTop10Hooks,
  generateHookSuggestions,
  type VttSegment,
  type HookAnalysis,
  type HookSuggestion
} from '../utils/geminiHooks';
import type { VideoAnalytics } from '../../netlify/functions/youtube-analytics';

interface OnboardingGuideProps {
  userProfile: YouTubeUserProfile | null;
  onOpenDocs: (tab?: 'onboarding' | 'oauth' | 'gemini' | 'studio-vs-cloud' | 'troubleshooting') => void;
  onEnterStudio: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  userProfile,
  onOpenDocs,
  onEnterStudio
}) => {
  // Active Onboarding Workflow Step: 'a' (Channel Metrics) | 'b' (Transcripts) | 'c' (Segment Hooks)
  const [activeStep, setActiveStep] = useState<'a' | 'b' | 'c'>('a');

  // Step A state: Channel Metrics
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<VideoAnalytics[]>([]);
  const [metricsFetched, setMetricsFetched] = useState<boolean>(false);

  // Step B state: Transcripts & 10 Segments
  const [vttFileName, setVttFileName] = useState<string | null>(null);
  const [cleanTranscript, setCleanTranscript] = useState<string>('');
  const [segments, setSegments] = useState<VttSegment[]>([]);
  const [isProcessingVtt, setIsProcessingVtt] = useState<boolean>(false);

  // Step C state: Hook Analysis & Suggestions
  const [selectedSegment, setSelectedSegment] = useState<VttSegment | null>(null);
  const [hookAnalysis, setHookAnalysis] = useState<HookAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<HookSuggestion[]>([]);
  const [selectedHook, setSelectedHook] = useState<HookSuggestion | null>(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState<boolean>(false);

  // Video trimming state
  const [, setVideoFile] = useState<File | null>(null);
  const [processedClipUrl, setProcessedClipUrl] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const authInfo = getTokenAuthInfo();

  // Load channel metrics for Step A
  const handleFetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const activeToken = authInfo.token || 'demo_token';
      let res = await fetch('/api/youtube-analytics?format=json&shortsOnly=true&limit=10', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!res.ok) {
        res = await fetch('/.netlify/functions/youtube-analytics?format=json&shortsOnly=true&limit=10', {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      }

      if (res.ok) {
        const data: VideoAnalytics[] = await res.json();
        setAnalyticsData(data);
        setMetricsFetched(true);
      }
    } catch (err) {
      console.error('Failed to fetch analytics metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Upload and process WebVTT file for Step B
  const handleVttUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVttFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await processRawVttText(text);
      }
    };
    reader.readAsText(file);
  };

  const processRawVttText = async (rawVtt: string) => {
    setIsProcessingVtt(true);
    try {
      const res = await processVttContent(rawVtt);
      setCleanTranscript(res.cleanTranscript);
      setSegments(res.segments);
    } catch (err) {
      console.error('Error processing transcript:', err);
    } finally {
      setIsProcessingVtt(false);
    }
  };

  // Load sample demo transcript for Step B
  const handleLoadSampleVtt = () => {
    const sampleVtt = `WEBVTT

00:00:00.000 --> 00:00:02.500
Stop scrolling right now if you edit videos in 2025.

00:00:02.500 --> 00:00:05.000
This one major mistake is completely destroying your retention rate.

00:00:05.000 --> 00:00:08.200
First, cut out all the silent gaps using automated audio trimming features.

00:00:08.200 --> 00:00:11.800
Second, ensure you add visual cut points every two to three seconds.

00:00:11.800 --> 00:00:15.500
Third, layer dynamic sound effects right under every text animation popup.

00:00:15.500 --> 00:00:19.200
Fourth, use curve speed ramping on long action sequence footage.

00:00:19.200 --> 00:00:23.000
Fifth, balance your audio frequencies with high pass filters and EQ compression.

00:00:23.000 --> 00:00:27.500
Sixth, use primary color correction handles to fix skin tone exposure.

00:00:27.500 --> 00:00:31.000
Seventh, insert b-roll overlays over static talking head segments.

00:00:31.000 --> 00:00:36.000
Eighth, craft an engaging open loop question at the very start.

00:00:36.000 --> 00:00:40.000
Ninth, synchronize dynamic subtitle text directly to vocal audio peaks.

00:00:40.000 --> 00:00:45.000
Tenth, export with high bitrates to preserve color details on social platforms.`;

    setVttFileName('sample_editing_tips.vtt');
    processRawVttText(sampleVtt);
  };

  // Select segment and generate AI hook suggestions for Step C
  const handleSelectSegment = async (seg: VttSegment) => {
    setSelectedSegment(seg);
    setIsGeneratingHooks(true);
    try {
      let analysis = hookAnalysis;
      if (!analysis) {
        const formatted = analyticsData.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          swipeRate: v.swipeRate,
          stayedToWatch: v.stayedToWatch,
          first4sText: v.first4sTranscript,
        }));
        analysis = await analyzeTop10Hooks(formatted);
        setHookAnalysis(analysis);
      }

      const hookOpts = await generateHookSuggestions(seg, analysis);
      setSuggestions(hookOpts);
      if (hookOpts.length > 0) {
        setSelectedHook(hookOpts[0]);
      }
    } catch (err) {
      console.error('Failed to generate hooks for segment:', err);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // Handle local video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setIsProcessingVideo(true);
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        setProcessedClipUrl(url);
        setIsProcessingVideo(false);
      }, 1000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100 p-6 md:p-10 select-none font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to StudioCut Desktop</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
              Complete Your First Viral Short Workflow
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 max-w-2xl">
              Get started step-by-step: fetch YouTube channel metrics, clean video transcripts into 10 segments, and select AI hooks with contiguous word trimming.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenDocs('onboarding')}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Built-in Docs & Help</span>
            </button>

            <button
              onClick={onEnterStudio}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-md"
            >
              <span>Enter Studio Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Stepper Navigation Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step A Button */}
          <button
            onClick={() => setActiveStep('a')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              activeStep === 'a'
                ? 'bg-indigo-950/60 border-indigo-500 shadow-xl ring-1 ring-indigo-500/50'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center ${
                activeStep === 'a' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                a
              </span>
              {metricsFetched && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Step A: Channel Metrics</h3>
            <p className="text-xs text-zinc-400 mt-1">Connect Google OAuth & view retention & swipe metrics</p>
          </button>

          {/* Step B Button */}
          <button
            onClick={() => setActiveStep('b')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              activeStep === 'b'
                ? 'bg-purple-950/60 border-purple-500 shadow-xl ring-1 ring-purple-500/50'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center ${
                activeStep === 'b' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                b
              </span>
              {segments.length > 0 && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Step B: Video Transcripts</h3>
            <p className="text-xs text-zinc-400 mt-1">Upload .VTT file & split into 10 message segments</p>
          </button>

          {/* Step C Button */}
          <button
            onClick={() => setActiveStep('c')}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
              activeStep === 'c'
                ? 'bg-emerald-950/60 border-emerald-500 shadow-xl ring-1 ring-emerald-500/50'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center ${
                activeStep === 'c' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                c
              </span>
              {selectedHook && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <h3 className="text-sm font-bold text-zinc-100">Step C: Select Segment Hooks</h3>
            <p className="text-xs text-zinc-400 mt-1">AI word trimming & 5s margin clip processing</p>
          </button>
        </div>

        {/* STEP A CONTENT: CHANNEL METRICS & GOOGLE AUTH */}
        {activeStep === 'a' && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  Step A: Fetch YouTube Channel Metrics
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Analyze swipe rates, retention %, views, likes, and first 4s transcript hooks
                </p>
              </div>

              {/* Google Auth Status & Action */}
              <div className="flex items-center space-x-3">
                {userProfile ? (
                  <div className="flex items-center space-x-3 bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800">
                    {userProfile.avatarUrl && (
                      <img src={userProfile.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-indigo-500" />
                    )}
                    <div className="text-xs">
                      <p className="font-semibold text-zinc-100 leading-tight">{userProfile.channelTitle}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">Google OAuth Active</p>
                    </div>
                    <button
                      onClick={() => {
                        clearStoredToken();
                        window.location.reload();
                      }}
                      className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Sign Out Google"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => initiateGoogleOAuthLogin()}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </button>
                )}

                <button
                  onClick={handleFetchMetrics}
                  disabled={metricsLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
                  <span>{metricsLoading ? 'Fetching...' : 'Fetch Channel Metrics'}</span>
                </button>
              </div>
            </div>

            {/* Metrics Display Grid */}
            {!metricsFetched ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <BarChart2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-200">No Metrics Loaded Yet</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Click "Fetch Channel Metrics" above to load your channel's retention and swipe data or test with the fallback dataset.
                  </p>
                </div>
                <button
                  onClick={handleFetchMetrics}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Fetch Channel Metrics Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Avg Swipe Rate</span>
                    <span className="text-lg font-bold text-amber-400">
                      {(analyticsData.reduce((acc, v) => acc + v.swipeRate, 0) / (analyticsData.length || 1)).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 block">Stayed vs Swiped Away</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Avg Stayed Watch</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {(analyticsData.reduce((acc, v) => acc + v.stayedToWatch, 0) / (analyticsData.length || 1)).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-zinc-500 block">Audience Retention</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Total Views</span>
                    <span className="text-lg font-bold text-indigo-400">
                      {analyticsData.reduce((acc, v) => acc + v.views, 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">{analyticsData.length} Videos Loaded</span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">Total Engagement</span>
                    <span className="text-lg font-bold text-rose-400">
                      {analyticsData.reduce((acc, v) => acc + v.likes + v.shares, 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">Likes & Shares</span>
                  </div>
                </div>

                {/* Table of Top Videos */}
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3 font-medium">Video Title</th>
                        <th className="py-2.5 px-3 font-medium text-right">Swipe Rate</th>
                        <th className="py-2.5 px-3 font-medium text-right">Retention</th>
                        <th className="py-2.5 px-3 font-medium text-right">Views</th>
                        <th className="py-2.5 px-3 font-medium">First 0-4s Hook Segment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                      {analyticsData.slice(0, 5).map((v) => (
                        <tr key={v.videoId} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2 px-3 text-zinc-200 font-sans font-medium">{v.title}</td>
                          <td className="py-2 px-3 text-right text-amber-400 font-semibold">{v.swipeRate}%</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{v.stayedToWatch}%</td>
                          <td className="py-2 px-3 text-right text-indigo-300">{v.views.toLocaleString()}</td>
                          <td className="py-2 px-3 text-zinc-400 max-w-[200px] truncate font-sans text-[11px]">
                            {v.first4sTranscript}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Next Step CTA */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveStep('b')}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-md"
                  >
                    <span>Proceed to Step B: Video Transcripts</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP B CONTENT: VIDEO TRANSCRIPTS & 10 SEGMENTS */}
        {activeStep === 'b' && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Step B: Process Video Transcripts into 10 Segments
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Import WebVTT captions or load the demo subtitle file to split text into 10 contiguous topic sections
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".vtt"
                  onChange={handleVttUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload .VTT File</span>
                </button>

                <button
                  onClick={handleLoadSampleVtt}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-colors"
                >
                  Load Sample VTT
                </button>
              </div>
            </div>

            {isProcessingVtt && (
              <div className="flex items-center justify-center space-x-3 bg-purple-950/30 border border-purple-500/30 p-4 rounded-xl text-purple-300 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Cleaning transcript and creating 10 message segments...</span>
              </div>
            )}

            {/* Cleaned Transcript & Segments Output */}
            {segments.length === 0 && !isProcessingVtt ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-purple-500/70 bg-zinc-950/40 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">
                    {vttFileName ? `Loaded: ${vttFileName}` : 'Click or drop your WebVTT transcript file here'}
                  </p>
                  <p className="text-xs text-zinc-500">Supports standard WebVTT subtitles exported from YouTube</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Full Clean Transcript */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" /> Cleaned Narrative Transcript
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">{cleanTranscript.length} chars</span>
                  </div>
                  <p className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80 max-h-24 overflow-y-auto font-sans leading-relaxed">
                    {cleanTranscript}
                  </p>
                </div>

                {/* 10 Segments Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    10 Video Segments ({segments.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {segments.map((seg) => (
                      <div
                        key={seg.id}
                        onClick={() => {
                          handleSelectSegment(seg);
                          setActiveStep('c');
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          selectedSegment?.id === seg.id
                            ? 'bg-purple-950/50 border-purple-500 shadow-lg ring-1 ring-purple-500/50'
                            : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-mono">
                              {seg.id}
                            </span>
                            {seg.title}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {seg.formattedStartTime} - {seg.formattedEndTime}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-sans">
                          "{seg.text}"
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 truncate max-w-[220px]">{seg.summary}</span>
                          <span className="text-purple-400 font-medium flex items-center gap-1 hover:underline">
                            Select Hook <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Step CTA */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveStep('c')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-md"
                  >
                    <span>Proceed to Step C: Select Hooks</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP C CONTENT: SELECT HOOKS & PROCESS VIDEO */}
        {activeStep === 'c' && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800 pb-5">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-emerald-400" />
                Step C: Select Hook & Process Video (+5s Margins)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generate AI hook suggestions with contiguous word trimming and process trimmed video clips
              </p>
            </div>

            {/* Segment Selector & Hook Options */}
            {!selectedSegment ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 space-y-3">
                <p className="text-xs text-zinc-400">Please select a segment from Step B to generate hook options.</p>
                <button
                  onClick={() => setActiveStep('b')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Go to Step B to Pick a Segment
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-purple-500/30 p-4 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-300">
                      Active Segment {selectedSegment.id}: {selectedSegment.title}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {selectedSegment.formattedStartTime} - {selectedSegment.formattedEndTime}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 italic">"{selectedSegment.text}"</p>
                </div>

                {isGeneratingHooks ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                    <p className="text-xs text-zinc-400">Generating hook variations with contiguous word trimming...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Generated AI Hook Options</h3>

                    <div className="space-y-3">
                      {suggestions.map((hook) => (
                        <div
                          key={hook.id}
                          onClick={() => setSelectedHook(hook)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            selectedHook?.id === hook.id
                              ? 'bg-emerald-950/40 border-emerald-500 shadow-xl ring-1 ring-emerald-500/50'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                  Retention Score: {hook.score}/100
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  {hook.formattedStartTime} → {hook.formattedEndTime}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-zinc-100 pt-1">"{hook.suggestedHookText}"</h4>
                            </div>

                            {selectedHook?.id === hook.id && (
                              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Selected Hook
                              </span>
                            )}
                          </div>

                          <div className="bg-zinc-900/80 p-2 rounded text-[11px] text-zinc-300">
                            <span className="font-semibold text-rose-400">Contiguous Words Trimmed: </span>
                            {hook.cutWordsDescription}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Local Video Clipping Input */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Video className="w-4 h-4 text-emerald-400" />
                        Extract Trimmed Hook Clip (+5s Margins)
                      </h3>
                      <p className="text-xs text-zinc-400">Select local video file to generate hook clip preview</p>
                    </div>

                    <input
                      type="file"
                      ref={videoInputRef}
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />

                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
                    >
                      Choose Local Video
                    </button>
                  </div>

                  {isProcessingVideo && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 py-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting video clip with 5s margins before and after hook...</span>
                    </div>
                  )}

                  {processedClipUrl && !isProcessingVideo && (
                    <div className="bg-zinc-900 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                        <span>Video Clip Ready!</span>
                        <a
                          href={processedClipUrl}
                          download="hook_clip_margin5s.mp4"
                          className="px-3 py-1 bg-emerald-600 text-white rounded flex items-center gap-1 text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Clip
                        </a>
                      </div>
                      <video src={processedClipUrl} controls className="w-full max-h-60 rounded-lg bg-black" />
                    </div>
                  )}
                </div>

                {/* Complete Onboarding CTA */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    First Workflow Completed Successfully!
                  </span>

                  <button
                    onClick={onEnterStudio}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2"
                  >
                    <span>Launch Full Studio Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
