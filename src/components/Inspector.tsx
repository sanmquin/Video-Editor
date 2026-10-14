import React from 'react'
import { Sliders, Volume2, Sun } from 'lucide-react'

export const Inspector: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border-l border-zinc-800 text-zinc-300 text-xs shrink-0 select-none overflow-y-auto">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-zinc-800 px-3 h-9 bg-zinc-900 shrink-0">
        <div className="flex space-x-3 font-medium">
          <button className="text-zinc-100 border-b-2 border-indigo-500 py-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>Transform</span>
          </button>
          <button className="text-zinc-400 hover:text-zinc-200 py-2 transition-colors flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
          <button className="text-zinc-400 hover:text-zinc-200 py-2 transition-colors flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            <span>Color</span>
          </button>
        </div>
      </div>

      {/* Inspector Form Sections */}
      <div className="p-3 space-y-4">
        {/* Transform Properties Group */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Transform</span>
            <span className="text-[10px] text-zinc-600 font-normal">Reset</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-zinc-500 text-[10px] block mb-1">Position X</label>
              <input
                type="text"
                value="0 px"
                readOnly
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-[10px] block mb-1">Position Y</label>
              <input
                type="text"
                value="0 px"
                readOnly
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-zinc-500 text-[10px] block mb-1">Scale</label>
              <input
                type="text"
                value="100 %"
                readOnly
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-[10px] block mb-1">Rotation</label>
              <input
                type="text"
                value="0.0 °"
                readOnly
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-zinc-800/80"></div>

        {/* Opacity & Compositing */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Compositing</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>Opacity</span>
              <span className="font-mono">100%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
              <div className="w-full h-full bg-indigo-500"></div>
            </div>
          </div>

          <div>
            <label className="text-zinc-500 text-[10px] block mb-1">Blend Mode</label>
            <select
              disabled
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs"
            >
              <option>Normal</option>
              <option>Multiply</option>
              <option>Screen</option>
              <option>Overlay</option>
            </select>
          </div>
        </div>

        <div className="h-px bg-zinc-800/80"></div>

        {/* Audio Properties */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Audio Volume</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
              <span>Volume</span>
              <span className="font-mono">0.0 dB</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-950 rounded border border-zinc-800 overflow-hidden">
              <div className="w-3/4 h-full bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
