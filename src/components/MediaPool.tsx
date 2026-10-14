import React from 'react'
import { Folder, Upload, Video, Music, Image as ImageIcon, Grid, List, Search } from 'lucide-react'

export const MediaPool: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border-r border-zinc-800 text-zinc-300 text-xs shrink-0 select-none">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 h-9 bg-zinc-900">
        <div className="flex space-x-3 font-medium">
          <button className="text-zinc-100 border-b-2 border-indigo-500 py-2">Media Pool</button>
          <button className="text-zinc-400 hover:text-zinc-200 py-2 transition-colors">Effects</button>
          <button className="text-zinc-400 hover:text-zinc-200 py-2 transition-colors">Audio</button>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded">
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded">
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search media..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-1 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-xs"
            readOnly
          />
        </div>
        <button className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-1 transition-colors">
          <Upload className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Asset Grid Placeholder Shell */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {/* Placeholder items showing structural layout */}
          <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded flex flex-col justify-between p-1.5 hover:border-zinc-700 cursor-pointer">
            <div className="flex items-center justify-between text-zinc-500">
              <Video className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px]">00:15</span>
            </div>
            <div className="text-[11px] text-zinc-300 truncate font-medium">Clip_01.mp4</div>
          </div>

          <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded flex flex-col justify-between p-1.5 hover:border-zinc-700 cursor-pointer">
            <div className="flex items-center justify-between text-zinc-500">
              <Music className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px]">02:30</span>
            </div>
            <div className="text-[11px] text-zinc-300 truncate font-medium">Background.mp3</div>
          </div>

          <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded flex flex-col justify-between p-1.5 hover:border-zinc-700 cursor-pointer">
            <div className="flex items-center justify-between text-zinc-500">
              <ImageIcon className="w-3 h-3 text-amber-400" />
              <span className="text-[10px]">IMG</span>
            </div>
            <div className="text-[11px] text-zinc-300 truncate font-medium">Logo.png</div>
          </div>
        </div>

        {/* Drag & drop upload area hint */}
        <div className="mt-4 border border-dashed border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center text-center text-zinc-500">
          <Folder className="w-6 h-6 mb-1 text-zinc-600" />
          <span className="text-[11px]">Import media files here</span>
        </div>
      </div>
    </div>
  )
}
