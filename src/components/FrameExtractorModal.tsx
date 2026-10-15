import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Download,
  CheckCircle,
  Play,
  Film,
  FolderOpen
} from 'lucide-react';

interface FrameExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CapturedFrame {
  timestamp: number; // e.g., 0, 1, 2, 3, 4
  dataUrl: string;
  width: number;
  height: number;
}

export const FrameExtractorModal: React.FC<FrameExtractorModalProps> = ({ isOpen, onClose }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [progress, setProgress] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processVideoFile(file);
    }
  };

  const processVideoFile = (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setFrames([]);
  };

  const captureFiveFrames = async () => {
    if (!videoUrl) return;
    setProcessing(true);
    setProgress('Initializing video decoder...');

    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve(true);
      video.onerror = (e) => reject(e);
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext('2d');

    const timestamps = [0, 1, 2, 3, 4];
    const captured: CapturedFrame[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      setProgress(`Capturing frame ${i + 1} of 5 at ${ts}.0s...`);

      video.currentTime = Math.min(ts, Math.max(0, video.duration - 0.1));

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            captured.push({
              timestamp: ts,
              dataUrl,
              width: canvas.width,
              height: canvas.height,
            });
          }
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });
    }

    setFrames(captured);
    setProcessing(false);
    setProgress('');
  };

  const downloadFrame = (frame: CapturedFrame) => {
    const a = document.createElement('a');
    a.href = frame.dataUrl;
    const fileName = videoFile
      ? `${videoFile.name.replace(/\.[^/.]+$/, '')}_frame_${frame.timestamp}s.png`
      : `frame_${frame.timestamp}s.png`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAllFrames = () => {
    frames.forEach((frame) => {
      downloadFrame(frame);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                First 4 Seconds Frame Extractor
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  5 Frames (0s, 1s, 2s, 3s, 4s)
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Extract visual hook screenshots for the first four seconds of any short video
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* Upload Drop Zone / Active File Banner */}
          {!videoFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all group text-center"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="p-4 bg-zinc-900 group-hover:bg-indigo-600/10 rounded-full border border-zinc-800 group-hover:border-indigo-500/30 text-zinc-400 group-hover:text-indigo-400 transition-colors mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-zinc-200">
                Click or drag & drop a video file to capture screenshots
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Supports MP4, WebM, MOV, and MKV video formats
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{videoFile.name}</p>
                  <p className="text-[11px] text-zinc-400">
                    Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition-colors flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Choose Another</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={captureFiveFrames}
                  disabled={processing}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{processing ? 'Processing...' : 'Capture First 4s Screenshots'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {processing && (
            <div className="bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>{progress}</span>
            </div>
          )}

          {/* Captured Frames Grid */}
          {frames.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Captured Visual Hook Frames ({frames.length})
                </h3>

                <button
                  onClick={downloadAllFrames}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All 5 Frames</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {frames.map((frame) => (
                  <div
                    key={frame.timestamp}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col group hover:border-indigo-500/60 transition-all shadow-md"
                  >
                    {/* Frame Image Container */}
                    <div className="relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">
                      <img
                        src={frame.dataUrl}
                        alt={`Frame at ${frame.timestamp}s`}
                        className="object-cover w-full h-full"
                      />
                      <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm border border-zinc-700 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                        t = {frame.timestamp}.0s
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="p-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {frame.width}x{frame.height}
                      </span>
                      <button
                        onClick={() => downloadFrame(frame)}
                        className="p-1 bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded transition-colors"
                        title={`Download frame at ${frame.timestamp}s`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden video player preview if file loaded */}
          {videoUrl && (
            <div className="bg-zinc-950/40 border border-zinc-800/60 p-3 rounded-xl flex items-center space-x-3 text-xs text-zinc-400">
              <Play className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Video ready for local screenshot capture. Frame extractor processes 100% locally in your browser.</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>5 frames extracted for t = 0s, 1s, 2s, 3s, 4s</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
