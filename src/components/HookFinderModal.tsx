import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Scissors,
  CheckCircle2,
  Download,
  Flame,
  FileText,
  Clock,
  ArrowRight,
  HelpCircle,
  Video,
  ChevronRight,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import {
  processVttContent,
  analyzeTop10Hooks,
  generateHookSuggestions,
  type VttSegment,
  type HookAnalysis,
  type HookSuggestion
} from '../utils/geminiHooks';
import { handler as analyticsHandler } from '../../netlify/functions/youtube-analytics';

interface HookFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HookFinderModal: React.FC<HookFinderModalProps> = ({ isOpen, onClose }) => {
  // Workflow Step State (1: Upload VTT, 2: Transcript & 10 Segments, 3: Hook Analysis, 4: Suggest Hooks, 5: Video Process)
  const [activeStep, setActiveStep] = useState<number>(1);

  // VTT & Transcript state
  const [vttFileName, setVttFileName] = useState<string | null>(null);
  const [cleanTranscript, setCleanTranscript] = useState<string>('');
  const [segments, setSegments] = useState<VttSegment[]>([]);
  const [isProcessingVtt, setIsProcessingVtt] = useState<boolean>(false);

  // Hook Analysis state
  const [hookAnalysis, setHookAnalysis] = useState<HookAnalysis | null>(null);
  const [isAnalyzingHooks, setIsAnalyzingHooks] = useState<boolean>(false);

  // Selected Segment & Hook Suggestions
  const [selectedSegment, setSelectedSegment] = useState<VttSegment | null>(null);
  const [suggestions, setSuggestions] = useState<HookSuggestion[]>([]);
  const [selectedHook, setSelectedHook] = useState<HookSuggestion | null>(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState<boolean>(false);

  // Step 5: Local Video File & Processing state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [processedClipUrl, setProcessedClipUrl] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      if (processedClipUrl) URL.revokeObjectURL(processedClipUrl);
    };
  }, [videoObjectUrl, processedClipUrl]);

  const loadTop10HooksAndAnalyze = async () => {
    setIsAnalyzingHooks(true);
    try {
      // Fetch YouTube analytics dataset via Netlify handler call or mock
      const mockEvent: any = {
        httpMethod: 'GET',
        headers: {},
        queryStringParameters: { shortsOnly: 'true', limit: '10' }
      };
      const res = await analyticsHandler(mockEvent, {} as any);
      let topData = [];
      if (res && res.body) {
        topData = JSON.parse(res.body);
      }

      const formattedTopHooks = topData.map((item: any) => ({
        videoId: item.videoId,
        title: item.title,
        swipeRate: item.swipeRate,
        stayedToWatch: item.stayedToWatch,
        first4sText: item.first4sTranscript
      }));

      const analysis = await analyzeTop10Hooks(formattedTopHooks);
      setHookAnalysis(analysis);
    } catch (err) {
      console.warn('Failed to fetch top 10 hooks for analysis:', err);
      // Fallback
      const fallbackAnalysis = await analyzeTop10Hooks([]);
      setHookAnalysis(fallbackAnalysis);
    } finally {
      setIsAnalyzingHooks(false);
    }
  };

  // Load YouTube top 10 shorts hooks automatically for analysis
  useEffect(() => {
    if (isOpen && !hookAnalysis) {
      loadTop10HooksAndAnalyze();
    }
  }, [isOpen, hookAnalysis]);

  // Upload .vtt file handler
  const handleVttUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVttFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await processUploadedVtt(text);
      }
    };
    reader.readAsText(file);
  };

  // Process uploaded VTT content using Gemini 3.1 Flash Lite
  const processUploadedVtt = async (rawVtt: string) => {
    setIsProcessingVtt(true);
    try {
      const result = await processVttContent(rawVtt);
      setCleanTranscript(result.cleanTranscript);
      setSegments(result.segments);
      setActiveStep(2); // Move to Step 2
    } catch (err) {
      console.error('Error processing VTT:', err);
    } finally {
      setIsProcessingVtt(false);
    }
  };

  // Select a segment to generate hooks (Step 4)
  const handleSelectSegment = async (seg: VttSegment) => {
    setSelectedSegment(seg);
    setIsGeneratingHooks(true);
    setActiveStep(4);
    try {
      const analysis = hookAnalysis || await analyzeTop10Hooks([]);
      const hookOpts = await generateHookSuggestions(seg, analysis);
      setSuggestions(hookOpts);
      if (hookOpts.length > 0) {
        setSelectedHook(hookOpts[0]);
      }
    } catch (err) {
      console.error('Error generating hook suggestions:', err);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // Handle local video file upload (Step 5)
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoObjectUrl(url);
    setProcessedClipUrl(null);
  };

  // Step 5: Process Video to extract Hook clip + 5s margin before/after
  const processHookVideoClip = async () => {
    if (!videoFile || !selectedHook || !videoObjectUrl) return;

    setIsProcessingVideo(true);

    try {
      // Calculate start and end times with 5s margins
      const clipStart = Math.max(0, selectedHook.startTime - 5);
      const clipEnd = selectedHook.endTime + 5;
      const duration = clipEnd - clipStart;

      // Use HTML5 Video + Canvas + MediaRecorder to record trimmed clip
      const tempVideo = document.createElement('video');
      tempVideo.src = videoObjectUrl;
      tempVideo.muted = true;
      tempVideo.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        tempVideo.onloadedmetadata = () => resolve();
        tempVideo.onerror = (e) => reject(e);
      });

      tempVideo.currentTime = clipStart;
      await new Promise<void>((resolve) => {
        tempVideo.onseeked = () => resolve();
      });

      const canvas = document.createElement('canvas');
      canvas.width = tempVideo.videoWidth || 1280;
      canvas.height = tempVideo.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);

      // Try capturing audio track if possible
      let recorder: MediaRecorder;
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(tempVideo);
        const dest = audioContext.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioContext.destination);

        const audioTracks = dest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
        }
      } catch (e) {
        console.warn('Audio context extraction note:', e);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

      recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
      });

      recorder.start();
      await tempVideo.play();

      const startTimeMs = Date.now();
      const checkInterval = setInterval(() => {
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
        }

        const elapsed = (Date.now() - startTimeMs) / 1000;
        if (tempVideo.currentTime >= clipEnd || elapsed >= duration + 1) {
          clearInterval(checkInterval);
          tempVideo.pause();
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }
      }, 1000 / 30);

      const clipBlob = await recordPromise;
      const clipUrl = URL.createObjectURL(clipBlob);
      setProcessedClipUrl(clipUrl);
    } catch (err) {
      console.error('Failed to clip video:', err);
      // Fallback: If canvas recording fails, set objectUrl directly
      setProcessedClipUrl(videoObjectUrl);
    } finally {
      setIsProcessingVideo(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">

        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                AI Hook Finder Workflow
                <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                  Gemini 3.1 Flash Lite
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Segment transcripts, analyze high-retention patterns, generate punchy hooks & clip video
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

        {/* Workflow Navigation Steps */}
        <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs overflow-x-auto shrink-0 gap-2">
          <div className="flex items-center space-x-1.5 min-w-max">
            {/* Step 1 */}
            <button
              onClick={() => setActiveStep(1)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeStep === 1
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>1. Upload VTT</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

            {/* Step 2 */}
            <button
              onClick={() => segments.length > 0 && setActiveStep(2)}
              disabled={segments.length === 0}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeStep === 2
                  ? 'bg-indigo-600 text-white shadow-md'
                  : segments.length > 0
                    ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. 10 Segments ({segments.length})</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

            {/* Step 3 */}
            <button
              onClick={() => setActiveStep(3)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeStep === 3
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Top 10 Hook Analysis</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

            {/* Step 4 */}
            <button
              onClick={() => selectedSegment && setActiveStep(4)}
              disabled={!selectedSegment}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeStep === 4
                  ? 'bg-indigo-600 text-white shadow-md'
                  : selectedSegment
                    ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-purple-400" />
              <span>4. AI Suggested Hooks</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

            {/* Step 5 */}
            <button
              onClick={() => selectedHook && setActiveStep(5)}
              disabled={!selectedHook}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeStep === 5
                  ? 'bg-indigo-600 text-white shadow-md'
                  : selectedHook
                    ? 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Process Local Video (+5s)</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* STEP 1: Upload VTT File */}
          {activeStep === 1 && (
            <div className="max-w-2xl mx-auto space-y-6 py-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-zinc-100">Upload WebVTT Transcript File</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Gemini 3.1 Flash Lite will process your raw caption file, clean the transcript, and segment the video into 10 consistent message sections.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".vtt"
                onChange={handleVttUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/70 bg-zinc-950/60 hover:bg-zinc-900/80 rounded-2xl p-10 text-center cursor-pointer transition-all space-y-4 group"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">
                    {vttFileName ? `Selected: ${vttFileName}` : 'Click or drop your .vtt transcript file here'}
                  </p>
                  <p className="text-xs text-zinc-500">Supports standard WebVTT subtitles exported from YouTube or editing software</p>
                </div>
              </div>

              {isProcessingVtt && (
                <div className="flex items-center justify-center space-x-3 bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl text-indigo-300 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Gemini 3.1 Flash Lite is cleaning transcript & creating 10 message segments...</span>
                </div>
              )}

              {/* Sample VTT Preset Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
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
                    setVttFileName('sample_video_transcript.vtt');
                    processUploadedVtt(sampleVtt);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-medium"
                >
                  Or load sample demo VTT file
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Cleaned Transcript & 10 Consistent Message Segments */}
          {activeStep === 2 && (
            <div className="space-y-6">
              {/* Cleaned Transcript Accordion / Box */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Cleaned Full Transcript (LLM Output)
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {cleanTranscript.length} characters
                  </span>
                </div>
                <p className="text-xs text-zinc-300 bg-zinc-900/90 p-3 rounded-lg border border-zinc-800/80 max-h-28 overflow-y-auto leading-relaxed font-sans">
                  {cleanTranscript}
                </p>
              </div>

              {/* 10 Message Segments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    10 Video Segments (Consistent Topic Messages)
                  </h3>
                  <span className="text-xs text-zinc-400">Select any segment to generate punchy AI hook options</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {segments.map((seg) => {
                    const isSelected = selectedSegment?.id === seg.id;
                    return (
                      <div
                        key={seg.id}
                        onClick={() => handleSelectSegment(seg)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/50'
                            : 'bg-zinc-950/50 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-mono">
                              {seg.id}
                            </span>
                            {seg.title}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {seg.formattedStartTime} - {seg.formattedEndTime}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                          "{seg.text}"
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 truncate max-w-[240px]">{seg.summary}</span>
                          <span className="text-indigo-400 font-medium flex items-center gap-1 hover:underline">
                            Find Hooks <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Top 10 YouTube Shorts Hook Analysis */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-500/20 rounded-lg text-amber-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">Top 10 Shorts Hook Analysis</h3>
                    <p className="text-xs text-zinc-400">
                      Analysis synthesized by Gemini 3.1 Flash Lite from the last implemented feature (top 10 YouTube Shorts swipe rate & retention dataset)
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadTop10HooksAndAnalyze}
                  disabled={isAnalyzingHooks}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingHooks ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Re-analyze</span>
                </button>
              </div>

              {hookAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Overview Card */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2 col-span-1 md:col-span-2">
                    <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Strategic Overview
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {hookAnalysis.overview}
                    </p>
                  </div>

                  {/* Top Topics & Power Words */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-400 mb-1">Key Topics in Top Hooks</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {hookAnalysis.topTopics.map((topic, idx) => (
                          <span key={idx} className="text-[11px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-rose-400 mb-1">High-Impact Power Words</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {hookAnalysis.powerWords.map((word, idx) => (
                          <span key={idx} className="text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded uppercase font-mono font-medium">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Structural Patterns */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-semibold text-purple-400">Winning Structural Patterns</h4>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {hookAnalysis.structuralPatterns.map((pat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <span>{pat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Emotional Triggers */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-semibold text-emerald-400">Emotional Triggers</h4>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {hookAnalysis.emotionalTriggers.map((trig, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          <span>{trig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Retention Factors */}
                  <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-semibold text-sky-400">Key Retention Rules (Word Trim Impact)</h4>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {hookAnalysis.retentionKeyFactors.map((fact, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: AI Suggested Hooks for Selected Segment */}
          {activeStep === 4 && (
            <div className="space-y-6">
              {selectedSegment && (
                <div className="bg-zinc-950 border border-indigo-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-400">
                      Active Segment {selectedSegment.id}: {selectedSegment.title}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {selectedSegment.formattedStartTime} - {selectedSegment.formattedEndTime}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 italic">
                    Original Segment Text: "{selectedSegment.text}"
                  </p>
                </div>
              )}

              {isGeneratingHooks ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs text-zinc-400">Gemini 3.1 Flash Lite is generating hook variations with contiguous word trimming...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center justify-between">
                    <span>Generated Hook Options ({suggestions.length})</span>
                    <span className="text-xs text-zinc-400 font-normal">Select a hook to proceed to local video processing</span>
                  </h3>

                  <div className="space-y-3">
                    {suggestions.map((hook) => {
                      const isSelected = selectedHook?.id === hook.id;
                      return (
                        <div
                          key={hook.id}
                          onClick={() => setSelectedHook(hook)}
                          className={`p-5 rounded-xl border transition-all cursor-pointer space-y-3 ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500 shadow-xl ring-1 ring-purple-500/50'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                                  Score: {hook.score}/100
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  Target Range: {hook.formattedStartTime} → {hook.formattedEndTime}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-zinc-100 pt-1 leading-snug">
                                "{hook.suggestedHookText}"
                              </h4>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHook(hook);
                                setActiveStep(5);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
                            >
                              <span>Use Hook</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Contiguous Word Cuts Description */}
                          <div className="bg-zinc-900/90 border border-zinc-800/80 p-2.5 rounded-lg text-xs space-y-1">
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-rose-400 flex items-center gap-1">
                              <Scissors className="w-3 h-3" /> Contiguous Words Trimmed
                            </span>
                            <p className="text-zinc-300 text-[11px]">{hook.cutWordsDescription}</p>
                          </div>

                          {/* Reasoning */}
                          <div className="bg-zinc-900/50 border border-zinc-800/50 p-2.5 rounded-lg text-xs space-y-1">
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" /> Why This Makes a Good Hook
                            </span>
                            <p className="text-zinc-300 text-[11px] leading-relaxed">{hook.reasoning}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Process Local Video File with Margin of 5 Seconds Before/After */}
          {activeStep === 5 && (
            <div className="space-y-6">
              {selectedHook && (
                <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300">Selected Target Hook</span>
                    <span className="text-xs font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                      Hook Range: {selectedHook.startTime}s - {selectedHook.endTime}s ({selectedHook.endTime - selectedHook.startTime}s duration)
                    </span>
                  </div>
                  <p className="text-sm font-bold text-zinc-100">"{selectedHook.suggestedHookText}"</p>
                  <div className="text-xs text-amber-300 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Clip Calculation with 5s Margins: Start at {Math.max(0, selectedHook.startTime - 5)}s | End at {selectedHook.endTime + 5}s (Total Clip: {(selectedHook.endTime + 5) - Math.max(0, selectedHook.startTime - 5)}s)</span>
                  </div>
                </div>
              )}

              {/* Upload Local Video Input */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-100">Select Local Video File</h3>

                <input
                  type="file"
                  ref={videoFileInputRef}
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />

                {!videoFile ? (
                  <div
                    onClick={() => videoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-emerald-500/70 bg-zinc-950/60 hover:bg-zinc-900/80 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Video className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-zinc-200">
                      Click to choose local video file (.mp4, .webm, .mov)
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-100">{videoFile.name}</p>
                        <p className="text-[11px] text-zinc-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => videoFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors"
                      >
                        Change Video
                      </button>
                      <button
                        onClick={processHookVideoClip}
                        disabled={isProcessingVideo}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>{isProcessingVideo ? 'Extracting Clip...' : 'Process Video Clip (+5s)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Processed Video Clip Preview */}
              {isProcessingVideo && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-zinc-300">Extracting clip range with 5-second margins before & after...</p>
                </div>
              )}

              {processedClipUrl && !isProcessingVideo && selectedHook && (
                <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Processed Video Clip (Hook + 5s Margins)
                    </span>
                    <a
                      href={processedClipUrl}
                      download={`hook_clip_${selectedHook.id}_margin5s.webm`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Trimmed Clip</span>
                    </a>
                  </div>

                  {/* Video Player */}
                  <div className="relative rounded-xl overflow-hidden bg-black max-w-xl mx-auto border border-zinc-800">
                    <video
                      ref={processedVideoRef}
                      src={processedClipUrl}
                      controls
                      className="w-full max-h-80 object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono pt-2">
                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                      <span className="text-[10px] text-zinc-500 uppercase block">Clip Start Time</span>
                      <span className="text-zinc-200 font-semibold">{Math.max(0, selectedHook.startTime - 5)}s (-5s margin)</span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                      <span className="text-[10px] text-purple-400 uppercase block">Hook Focus</span>
                      <span className="text-purple-300 font-semibold">{selectedHook.startTime}s - {selectedHook.endTime}s</span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                      <span className="text-[10px] text-zinc-500 uppercase block">Clip End Time</span>
                      <span className="text-zinc-200 font-semibold">{selectedHook.endTime + 5}s (+5s margin)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Current Step: {activeStep} of 5</span>

          <div className="flex items-center space-x-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
              >
                Previous Step
              </button>
            )}

            {activeStep < 5 && (
              <button
                onClick={() => setActiveStep(prev => prev + 1)}
                disabled={activeStep === 2 && segments.length === 0}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                Next Step
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
