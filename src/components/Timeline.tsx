import React from 'react'
import {
  Scissors,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Eye,
  Volume2,
  Lock,
  Plus,
  Magnet
} from 'lucide-react'

export const Timeline: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800 text-zinc-300 text-xs select-none">
      {/* Timeline Control Toolbar */}
      <div className="h-10 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors" title="Split / Cut">
            <Scissors className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors" title="Duplicate">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1"></div>

          <button className="p-1.5 rounded bg-zinc-800 text-indigo-400" title="Snapping Enabled">
            <Magnet className="w-4 h-4" />
          </button>
        </div>

        {/* Track Action & Zoom Controls */}
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Track</span>
          </button>
          <div className="flex items-center space-x-2 text-zinc-400">
            <ZoomOut className="w-3.5 h-3.5" />
            <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-indigo-500"></div>
            </div>
            <ZoomIn className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Track Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Track Headers (Left sidebar) */}
        <div className="w-48 border-r border-zinc-800 bg-zinc-900/80 shrink-0 flex flex-col">
          {/* Time Ruler Offset Header */}
          <div className="h-7 border-b border-zinc-800 bg-zinc-900 px-3 flex items-center text-[10px] text-zinc-500 font-mono">
            TRACKS
          </div>

          {/* Video Track 2 Header */}
          <div className="h-14 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-indigo-400">V2</span>
              <span className="text-zinc-400 text-[11px]">Text / Overlay</span>
            </div>
            <div className="flex items-center space-x-1 text-zinc-500">
              <Eye className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
              <Lock className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
            </div>
          </div>

          {/* Video Track 1 Header */}
          <div className="h-14 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-indigo-400">V1</span>
              <span className="text-zinc-400 text-[11px]">Main Video</span>
            </div>
            <div className="flex items-center space-x-1 text-zinc-500">
              <Eye className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
              <Lock className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
            </div>
          </div>

          {/* Audio Track 1 Header */}
          <div className="h-14 border-b border-zinc-800/80 px-3 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-emerald-400">A1</span>
              <span className="text-zinc-400 text-[11px]">Audio</span>
            </div>
            <div className="flex items-center space-x-1 text-zinc-500">
              <Volume2 className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
              <Lock className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Timeline Sequence Canvas */}
        <div className="flex-1 overflow-x-auto relative flex flex-col bg-zinc-950">
          {/* Time Ruler */}
          <div className="h-7 border-b border-zinc-800 bg-zinc-900/90 flex items-center px-4 space-x-16 font-mono text-[10px] text-zinc-500 shrink-0">
            <span>00:00:00</span>
            <span>00:01:00</span>
            <span>00:02:00</span>
            <span>00:03:00</span>
            <span>00:04:00</span>
            <span>00:05:00</span>
          </div>

          {/* Playhead Indicator Line */}
          <div className="absolute top-0 bottom-0 left-44 w-0.5 bg-red-500 z-10 pointer-events-none">
            <div className="w-3 h-3 bg-red-500 -translate-x-[5px] rotate-45 rounded-xs"></div>
          </div>

          {/* Track Canvas Bands */}
          <div className="flex-1 flex flex-col">
            {/* V2 Track Lane */}
            <div className="h-14 border-b border-zinc-800/40 relative p-1.5 flex items-center">
              <div className="absolute left-28 w-48 h-10 bg-indigo-950/80 border border-indigo-500/50 rounded p-1.5 text-[11px] text-indigo-200 font-medium overflow-hidden shadow-sm">
                Title Overlay
              </div>
            </div>

            {/* V1 Track Lane */}
            <div className="h-14 border-b border-zinc-800/40 relative p-1.5 flex items-center">
              <div className="absolute left-4 w-72 h-10 bg-blue-950/80 border border-blue-500/50 rounded p-1.5 text-[11px] text-blue-200 font-medium overflow-hidden shadow-sm">
                Clip_01.mp4
              </div>
              <div className="absolute left-80 w-60 h-10 bg-blue-950/80 border border-blue-500/50 rounded p-1.5 text-[11px] text-blue-200 font-medium overflow-hidden shadow-sm">
                Clip_02.mp4
              </div>
            </div>

            {/* A1 Track Lane */}
            <div className="h-14 border-b border-zinc-800/40 relative p-1.5 flex items-center">
              <div className="absolute left-4 w-[336px] h-10 bg-emerald-950/80 border border-emerald-500/50 rounded p-1.5 text-[11px] text-emerald-200 font-medium overflow-hidden shadow-sm">
                Background_Music.mp3
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
