import React from 'react'
import { Play, SkipBack, SkipForward, Volume2, Maximize, RotateCcw } from 'lucide-react'

export const PreviewViewport: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-300 select-none overflow-hidden">
      {/* Viewport Info Header */}
      <div className="h-8 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-indigo-400">Program</span>
          <span className="text-zinc-600">|</span>
          <span>1920x1080 @ 60fps</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">100%</span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-black flex items-center justify-center relative p-4 overflow-hidden">
        {/* Placeholder video canvas screen */}
        <div className="aspect-video w-full max-w-4xl max-h-full bg-zinc-900 border border-zinc-800/80 rounded flex flex-col items-center justify-center relative shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-zinc-800/60 flex items-center justify-center mb-3 text-zinc-400 border border-zinc-700/50">
            <Play className="w-8 h-8 translate-x-0.5 text-indigo-400" />
          </div>
          <span className="text-sm font-medium text-zinc-400">Preview Player Shell</span>
          <span className="text-xs text-zinc-600 mt-1">No media playing</span>

          {/* Timecode overlay */}
          <div className="absolute bottom-3 right-3 bg-zinc-950/80 border border-zinc-800 px-2 py-1 rounded text-xs font-mono text-zinc-300">
            00:00:00:00
          </div>
        </div>
      </div>

      {/* Playback Control Bar */}
      <div className="h-12 border-t border-zinc-800 bg-zinc-900 px-4 flex items-center justify-between shrink-0">
        <div className="font-mono text-sm font-semibold text-indigo-400">
          00:00:00:00 <span className="text-xs font-normal text-zinc-500">/ 00:05:00:00</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            <SkipBack className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow">
            <Play className="w-4 h-4 translate-x-0.5" />
          </button>
          <button className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-3 text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-indigo-500 rounded-full"></div>
            </div>
          </div>
          <button className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
