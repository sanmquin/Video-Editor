import React, { useState, useCallback } from 'react';
import { X, Download, BarChart2, CheckCircle2, LogIn, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import type { VideoAnalytics } from '../../netlify/functions/youtube-analytics';

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

  const fetchAnalytics = useCallback(async (token?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeToken = token ?? accessToken ?? 'demo_token';
      const response = await fetch(`/.netlify/functions/youtube-analytics?format=json`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading analytics data.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // When modal is opened, trigger initial fetch via event/callback
  const handleModalOpen = () => {
    fetchAnalytics();
  };

  const handleAuthenticate = () => {
    // In production, trigger Google OAuth 2.0 flow
    // For web app demo, prompt for access token or authenticate with demo token
    const tokenInput = prompt(
      "Enter your YouTube OAuth Access Token (or leave blank for Demo Account):"
    );

    const token = tokenInput?.trim() || "demo_token_" + Date.now();
    localStorage.setItem('yt_access_token', token);
    setAccessToken(token);
    setIsAuthenticated(true);
    fetchAnalytics(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('yt_access_token');
    setAccessToken('');
    setIsAuthenticated(false);
    fetchAnalytics('demo_token');
  };

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const activeToken = accessToken || 'demo_token';
      const response = await fetch(`/.netlify/functions/youtube-analytics?format=csv`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate CSV: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `youtube_analytics_last_25_videos_${new Date().toISOString().slice(0, 10)}.csv`;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">

        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                YouTube Analytics Export
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                  Last 25 Videos
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Export performance metrics directly from Netlify function endpoint
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auth status */}
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
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Generating CSV...' : 'Export CSV'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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

          {/* Quick Metrics Summary Bar */}
          {data.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Total Videos</span>
                <span className="text-lg font-semibold text-zinc-100">{data.length}</span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Total Views</span>
                <span className="text-lg font-semibold text-indigo-400">
                  {data.reduce((acc, curr) => acc + curr.views, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Avg Retention</span>
                <span className="text-lg font-semibold text-emerald-400">
                  {(
                    data.reduce((acc, curr) => acc + curr.averagePercentageViewed, 0) / data.length
                  ).toFixed(1)}%
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Total Likes</span>
                <span className="text-lg font-semibold text-rose-400">
                  {data.reduce((acc, curr) => acc + curr.likes, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Total Comments</span>
                <span className="text-lg font-semibold text-amber-400">
                  {data.reduce((acc, curr) => acc + curr.commentsAdded, 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 p-3 rounded-lg">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Net Subscribers</span>
                <span className="text-lg font-semibold text-emerald-400">
                  +{(
                    data.reduce((acc, curr) => acc + curr.subscribersGained, 0) -
                    data.reduce((acc, curr) => acc + curr.subscribersLost, 0)
                  ).toLocaleString()}
                </span>
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
            ) : data.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-zinc-400 text-xs">No analytics data currently loaded in preview.</p>
                <button
                  onClick={() => handleModalOpen()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium transition-colors"
                >
                  Load Analytics Preview
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 font-medium text-zinc-300">Video ID</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 min-w-[220px]">Title</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 whitespace-nowrap">Publish Time</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Views</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Duration</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Avg View Time</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Avg % Viewed</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Engaged Views</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Stayed Watch %</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Unique Viewers</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Returning Viewers</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Likes</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Dislikes</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Comments</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Shares</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Subs Gained</th>
                    <th className="py-2.5 px-3 font-medium text-zinc-300 text-right">Subs Lost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {data.map((row) => (
                    <tr key={row.videoId} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2 px-3 text-indigo-400 font-medium whitespace-nowrap">{row.videoId}</td>
                      <td className="py-2 px-3 text-zinc-200 font-sans max-w-[260px] truncate" title={row.title}>
                        {row.title}
                      </td>
                      <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                        {new Date(row.publishTime).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-100">{row.views.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-zinc-400">{row.duration}</td>
                      <td className="py-2 px-3 text-right text-zinc-300">{row.averageViewTime}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{row.averagePercentageViewed}%</td>
                      <td className="py-2 px-3 text-right text-zinc-300">{row.engagedViews.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{row.stayedToWatch}%</td>
                      <td className="py-2 px-3 text-right text-zinc-300">{row.uniqueViewers.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-zinc-400">{row.returningViewers.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-zinc-200">{row.likes.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-zinc-400">{row.dislikes.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-zinc-200">{row.commentsAdded.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-zinc-300">{row.shares.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">+{row.subscribersGained}</td>
                      <td className="py-2 px-3 text-right text-rose-400">-{row.subscribersLost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Showing {data.length} items</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={loading || downloading}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors"
            >
              Download CSV
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
