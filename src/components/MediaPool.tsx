import React, { useState, useRef } from 'react'
import { Folder, Upload, Video, Music, Image as ImageIcon, Grid, List, Search, Trash2 } from 'lucide-react'

interface ImportedAsset {
  id: string
  name: string
  size: string
  type: 'video' | 'audio' | 'image' | 'vtt'
  url: string
}

export const MediaPool: React.FC = () => {
  const [assets, setAssets] = useState<ImportedAsset[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newAssets: ImportedAsset[] = Array.from(files).map((file, idx) => {
      let type: 'video' | 'audio' | 'image' | 'vtt' = 'video'
      if (file.type.startsWith('audio/')) type = 'audio'
      else if (file.type.startsWith('image/')) type = 'image'
      else if (file.name.endsWith('.vtt')) type = 'vtt'

      return {
        id: `asset_${Date.now()}_${idx}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type,
        url: URL.createObjectURL(file)
      }
    })

    setAssets((prev) => [...prev, ...newAssets])
  }

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 border-r border-zinc-800 text-zinc-300 text-xs shrink-0 select-none">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 h-9 bg-zinc-900">
        <div className="flex space-x-3 font-medium">
          <button className="text-zinc-100 border-b-2 border-indigo-500 py-2">Media Pool ({assets.length})</button>
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
            placeholder="Search media assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-2 py-1 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="video/*,audio/*,image/*,.vtt"
          onChange={handleFileImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center gap-1 transition-colors font-medium text-xs"
          title="Import Local Media Files"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>

      {/* Media Assets List or Dropzone */}
      <div className="flex-1 p-3 overflow-y-auto">
        {filteredAssets.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-full min-h-[180px] border border-dashed border-zinc-800 hover:border-indigo-500/60 bg-zinc-950/40 hover:bg-zinc-950/80 rounded-xl p-4 flex flex-col items-center justify-center text-center text-zinc-500 transition-all cursor-pointer space-y-2 group"
          >
            <div className="p-3 rounded-full bg-zinc-900 group-hover:bg-indigo-500/10 border border-zinc-800 text-zinc-400 group-hover:text-indigo-400 transition-colors">
              <Folder className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-zinc-300 block">No media imported</span>
              <span className="text-[11px] text-zinc-500 block">Click to import local video, audio or WebVTT files</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="aspect-video bg-zinc-950 border border-zinc-800 rounded flex flex-col justify-between p-2 hover:border-indigo-500/60 cursor-pointer relative group"
              >
                <div className="flex items-center justify-between text-zinc-500">
                  {asset.type === 'video' && <Video className="w-3.5 h-3.5 text-indigo-400" />}
                  {asset.type === 'audio' && <Music className="w-3.5 h-3.5 text-emerald-400" />}
                  {asset.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-amber-400" />}
                  {asset.type === 'vtt' && <Folder className="w-3.5 h-3.5 text-purple-400" />}
                  <span className="text-[10px] text-zinc-500 font-mono">{asset.size}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-zinc-200 truncate font-medium max-w-[100px]" title={asset.name}>
                    {asset.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteAsset(asset.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                    title="Remove asset"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
