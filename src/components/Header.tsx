import React from 'react'
import {
  Download,
  Settings,
  Undo2,
  Redo2,
  Film
} from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <header className="h-12 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between text-zinc-300 text-sm select-none shrink-0">
      {/* Left: Branding & Menu */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 font-semibold text-zinc-100">
          <Film className="w-5 h-5 text-indigo-500" />
          <span>StudioCut</span>
        </div>

        <nav className="flex items-center space-x-1 text-xs text-zinc-400">
          <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors">File</button>
          <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors">Edit</button>
          <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors">View</button>
          <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors">Sequence</button>
          <button className="px-2.5 py-1 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors">Help</button>
        </nav>
      </div>

      {/* Center: Project Title & Quick Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-800/80 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-zinc-200">Untitled Project</span>
        </div>
        <div className="flex items-center space-x-1 text-zinc-400">
          <button className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors" title="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors" title="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Export & Settings */}
      <div className="flex items-center space-x-3">
        <button className="p-1.5 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
        <button className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  )
}
