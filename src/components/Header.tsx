import React from 'react'
import {
  Download,
  Settings,
  Undo2,
  Redo2,
  Film,
  BarChart2,
  Camera,
  Sparkles,
  BookOpen,
  Zap,
  Layout,
  CheckCircle2,
  LogIn
} from 'lucide-react'
import { getTokenAuthInfo, initiateGoogleOAuthLogin } from '../utils/googleAuth'

interface HeaderProps {
  activeView: 'onboarding' | 'studio'
  onViewChange: (view: 'onboarding' | 'studio') => void
  onOpenDocs: (tab?: 'onboarding' | 'oauth' | 'gemini' | 'studio-vs-cloud' | 'troubleshooting') => void
  onOpenAnalytics: () => void
  onOpenFrameExtractor: () => void
  onOpenHookFinder: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenDocs,
  onOpenAnalytics,
  onOpenFrameExtractor,
  onOpenHookFinder
}) => {
  const authInfo = getTokenAuthInfo()

  return (
    <header className="h-12 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between text-zinc-300 text-sm select-none shrink-0">
      {/* Left: Branding & View Mode Switcher */}
      <div className="flex items-center space-x-6">
        <div
          onClick={() => onViewChange('onboarding')}
          className="flex items-center space-x-2 font-bold text-zinc-100 cursor-pointer"
        >
          <Film className="w-5 h-5 text-indigo-500" />
          <span>StudioCut</span>
        </div>

        {/* View Switcher: Onboarding Guide vs Studio Workspace */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800/80 text-xs font-medium">
          <button
            onClick={() => onViewChange('onboarding')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
              activeView === 'onboarding'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Onboarding Guide</span>
          </button>

          <button
            onClick={() => onViewChange('studio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeView === 'studio'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            <span>Studio Workspace</span>
          </button>
        </div>
      </div>

      {/* Center: Project Title & Quick Actions */}
      <div className="hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-800/80 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-zinc-200">Local Project</span>
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

      {/* Right: Actions */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={() => onOpenDocs('onboarding')}
          className="flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium border border-zinc-700 transition-colors"
          title="Built-in Documentation & Help Center"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Built-in Docs</span>
        </button>

        <button
          onClick={onOpenHookFinder}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm"
          title="AI Hook Finder Workflow"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-200" />
          <span>Find Hooks</span>
        </button>

        <button
          onClick={onOpenFrameExtractor}
          className="flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium border border-zinc-700 transition-colors hidden sm:flex"
          title="Capture First 4s Screenshots"
        >
          <Camera className="w-3.5 h-3.5 text-indigo-400" />
          <span>Frame Screenshots</span>
        </button>

        <button
          onClick={onOpenAnalytics}
          className="flex items-center space-x-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-medium border border-zinc-700 transition-colors"
          title="YouTube Analytics Export"
        >
          <BarChart2 className="w-3.5 h-3.5 text-red-500" />
          <span>Analytics</span>
        </button>

        {authInfo.isValid ? (
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded hidden lg:inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> OAuth Active
          </span>
        ) : (
          <button
            onClick={() => initiateGoogleOAuthLogin()}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors hidden lg:flex"
            title="Authenticate Google OAuth"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}

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
