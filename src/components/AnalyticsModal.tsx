import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Download,
  BarChart2,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  AlertCircle,
  FileText,
  Upload,
  Filter,
  Flame,
  Search,
  Code
} from 'lucide-react';
import type { VideoAnalytics } from '../../netlify/functions/youtube-analytics';
import { parseVttContent } from '../utils/vttParser';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem('yt_access_token') || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('yt_access_token'));
  });
  const [data, setData] = useState<VideoAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [filterMode, setFilterMode] = useState<'all' | 'shorts'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAnalytics = useCallback(async (token?: string, shortsOnly = false, singleVideoId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeToken = token ?? accessToken ?? 'demo_token';
      let query = `format=json`;
      if (shortsOnly) {
        query += `&shortsOnly=true&limit=10`;
      }
      if (singleVideoId) {
        query += `&videoId=${encodeURIComponent(singleVideoId)}`;
      }

      let response = await fetch(`/api/youtube-analytics?${query}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!response.ok) {
        response = await fetch(`/.netlify/functions/youtube-analytics?${query}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const json: VideoAnalytics[] = await response.json();
      setData(json);
      if (json.length > 0 && (!selectedVideoId || !json.some(v => v.videoId === selectedVideoId))) {
        setSelectedVideoId(json[0].videoId);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading analytics data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedVideoId]);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics(undefined, filterMode === 'shorts');
    }
  }, [isOpen]);

  const handleModalOpen = () => {
    fetchAnalytics(undefined, filterMode === 'shorts');
  };

  const handleAuthenticate = () => {
    const tokenInput = prompt(
      "Enter your YouTube OAuth Access Token (or leave blank for Demo Account):"
    );

    const token = tokenInput?.trim() || "demo_token_" + Date.now();
    localStorage.setItem('yt_access_token', token);
    setAccessToken(token);
    setIsAuthenticated(true);
    fetchAnalytics(token, filterMode === 'shorts');
  };

  const handleLogout = () => {
    localStorage.removeItem('yt_access_token');
    setAccessToken('');
    setIsAuthenticated(false);
    fetchAnalytics('demo_token', filterMode === 'shorts');
  };

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const activeToken = accessToken || 'demo_token';
      let query = `format=csv`;
      if (filterMode === 'shorts') query += `&shortsOnly=true&limit=10`;

      let response = await fetch(`/api/youtube-analytics?${query}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!response.ok) {
        response = await fetch(`/.netlify/functions/youtube-analytics?${query}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to generate CSV: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `youtube_analytics_${filterMode}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  // Upload .vtt file for selected video
  const handleVttFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVideoId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const vttContent = event.target?.result as string;
      if (!vttContent) return;

      const parsed = parseVttContent(vttContent);
      setData(prevData =>
        prevData.map(v => {
          if (v.videoId === selectedVideoId) {
            return {
              ...v,
              cleanTranscript: parsed.cleanTranscript,
              first4sTranscript: parsed.first4sTranscriptJson
            };
          }
          return v;
        })
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download First 4s Hook Transcript stringified JSON file
  const handleDownloadHookJson = (video: VideoAnalytics) => {
    const blob = new Blob([video.first4sTranscript], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hook_transcript_${video.videoId}_4s.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Filtered dataset
  const displayedData = data.filter(item => {
    if (filterMode === 'shorts' && !item.isShort) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.videoId.toLowerCase().includes(q) || item.title.toLowerCase().includes(q);
    }
    return true;
  });

  const activeVideo = data.find(v => v.videoId === selectedVideoId) || displayedData[0] || null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">

        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                YouTube Analytics & Hook Transcript Features
                <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Swipe, Retention & Engagement
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Analyze first 4-second transcript hooks alongside swipe rate, retention & engagement metrics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>YouTube Authenticated</span>
                <button
                  onClick={handleLogout}
                  className="ml-2 text-zinc-400 hover:text-zinc-200 p-0.5 hover:bg-zinc-800 rounded"
                  title="Disconnect YouTube"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthenticate}
                className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Authenticate YouTube</span>
              </button>
            )}

            <button
              onClick={() => handleModalOpen()}
              disabled={loading}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Refresh Analytics Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={handleExportCsv}
              disabled={loading || downloading}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/30 flex items-center justify-between text-xs gap-4 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-400 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => {
                setFilterMode('all');
                fetchAnalytics(undefined, false);
              }}
              className={`px-3 py-1 rounded-md transition-colors font-medium ${
                filterMode === 'all'
                  ? 'bg-zinc-700 text-white border border-zinc-600'
                  : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              All Videos (25)
            </button>
            <button
              onClick={() => {
                setFilterMode('shorts');
                fetchAnalytics(undefined, true);
              }}
              className={`px-3 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
                filterMode === 'shorts'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Latest 10 Short Videos
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search Video ID or Title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Detailed Video Analysis Header for Active Video */}
          {activeVideo && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {activeVideo.videoId}
                    </span>
                    {activeVideo.isShort && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        SHORT
                      </span>
                    )}
                    <span className="text-xs text-zinc-400">
                      Published {new Date(activeVideo.publishTime).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-1">{activeVideo.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".vtt"
                    onChange={handleVttFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    title="Upload VTT caption file to replace transcript"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Upload .VTT Transcript</span>
                  </button>

                  <button
                    onClick={() => handleDownloadHookJson(activeVideo)}
                    className="flex items-center space-x-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    title="Download 0-4s timestamped hook transcript stringified JSON"
                  >
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download 0-4s Hook JSON</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards Grid for Key Video Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                <div className="bg-zinc-900 border border-zinc-800/90 p-2.5 rounded-lg">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Swipe Rate</span>
                  <span className="text-base font-semibold text-amber-400">{activeVideo.swipeRate}%</span>
                  <span className="text-[10px] text-zinc-500 block">Stayed vs Swiped away</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800/90 p-2.5 rounded-lg">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Retention (Stayed)</span>
                  <span className="text-base font-semibold text-emerald-400">{activeVideo.stayedToWatch}%</span>
                  <span className="text-[10px] text-zinc-500 block">Avg: {activeVideo.averagePercentageViewed}%</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800/90 p-2.5 rounded-lg">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Views</span>
                  <span className="text-base font-semibold text-indigo-400">{activeVideo.views.toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-500 block">Unique: {activeVideo.uniqueViewers.toLocaleString()}</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800/90 p-2.5 rounded-lg">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Engagement Likes</span>
                  <span className="text-base font-semibold text-rose-400">{activeVideo.likes.toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-500 block">Comments: {activeVideo.commentsAdded.toLocaleString()}</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800/90 p-2.5 rounded-lg">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Shares</span>
                  <span className="text-base font-semibold text-sky-400">{activeVideo.shares.toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-500 block">Subs: +{activeVideo.subscribersGained}</span>
                </div>
              </div>

              {/* Transcript & First 4s Hook Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Full Clean Transcript */}
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" /> Clean Transcript
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80 max-h-24 overflow-y-auto font-sans leading-relaxed">
                    {activeVideo.cleanTranscript || "No transcript available."}
                  </div>
                </div>

                {/* First 4 Seconds Timestamped Hook JSON */}
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-emerald-400" /> First 4 Seconds Timestamped (JSON)
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80 max-h-24 overflow-y-auto whitespace-pre-wrap leading-tight">
                    {activeVideo.first4sTranscript}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="border border-zinc-800 rounded-lg overflow-x-auto bg-zinc-950/40">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-400">Fetching YouTube Analytics metrics...</span>
              </div>
            ) : displayedData.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-zinc-400 text-xs">No analytics data currently matches the active filter.</p>
                <button
                  onClick={() => {
                    setFilterMode('all');
                    setSearchQuery('');
                    fetchAnalytics(undefined, false);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 font-medium text-zinc-300">Video ID</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 min-w-[200px]">Title</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Swipe Rate</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Stayed Watch</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Views</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Likes</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Comments</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Shares</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300">0-4s Hook Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {displayedData.map((row) => {
                    const isSelected = row.videoId === activeVideo?.videoId;
                    let parsedHookText = "";
                    try {
                      const parsedHook = JSON.parse(row.first4sTranscript);
                      if (Array.isArray(parsedHook)) {
                        parsedHookText = parsedHook.map(p => p.text).join(' ');
                      }
                    } catch {
                      parsedHookText = row.first4sTranscript;
                    }

                    return (
                      <tr
                        key={row.videoId}
                        onClick={() => setSelectedVideoId(row.videoId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : 'hover:bg-zinc-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 text-indigo-400 font-medium whitespace-nowrap">
                          {row.videoId}
                        </td>
                        <td className="py-2 px-3 text-zinc-200 font-sans max-w-[220px] truncate" title={row.title}>
                          {row.title}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-400 font-medium">{row.swipeRate}%</td>
                        <td className="py-2 px-3 text-right text-emerald-400">{row.stayedToWatch}%</td>
                        <td className="py-2 px-3 text-right text-zinc-100">{row.views.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-zinc-200">{row.likes.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-zinc-200">{row.commentsAdded.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-sky-400">{row.shares.toLocaleString()}</td>
                        <td className="py-2 px-3 text-zinc-400 font-sans max-w-[200px] truncate text-[11px]" title={parsedHookText}>
                          {parsedHookText || 'No hook segment'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Showing {displayedData.length} items</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={loading || downloading}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
