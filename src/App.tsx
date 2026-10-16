import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { MediaPool } from './components/MediaPool'
import { PreviewViewport } from './components/PreviewViewport'
import { Inspector } from './components/Inspector'
import { Timeline } from './components/Timeline'
import { OnboardingGuide } from './components/OnboardingGuide'
import { BuiltInDocsModal } from './components/BuiltInDocsModal'
import { AnalyticsModal } from './components/AnalyticsModal'
import { FrameExtractorModal } from './components/FrameExtractorModal'
import { HookFinderModal } from './components/HookFinderModal'
import {
  parseAuthResponseFromUrl,
  getStoredToken,
  fetchYouTubeUserProfile,
  type YouTubeUserProfile
} from './utils/googleAuth'

export function App() {
  // Main view mode: 'onboarding' (welcoming initial workflow screen) | 'studio' (full video studio workspace)
  const [activeView, setActiveView] = useState<'onboarding' | 'studio'>('onboarding')

  // Modals state
  const [isDocsOpen, setIsDocsOpen] = useState(false)
  const [docsInitialTab, setDocsInitialTab] = useState<'onboarding' | 'oauth' | 'gemini' | 'studio-vs-cloud' | 'troubleshooting'>('onboarding')

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isFrameExtractorOpen, setIsFrameExtractorOpen] = useState(false)
  const [isHookFinderOpen, setIsHookFinderOpen] = useState(false)

  // Authenticated YouTube Profile State
  const [userProfile, setUserProfile] = useState<YouTubeUserProfile | null>(null)

  // Parse Google OAuth redirect token from URL hash on mount
  useEffect(() => {
    const authResult = parseAuthResponseFromUrl()
    const activeToken = authResult?.token || getStoredToken()

    if (activeToken) {
      fetchYouTubeUserProfile(activeToken).then(profile => {
        if (profile) setUserProfile(profile)
      })
    }
  }, [])

  const handleOpenDocs = (tab?: 'onboarding' | 'oauth' | 'gemini' | 'studio-vs-cloud' | 'troubleshooting') => {
    if (tab) setDocsInitialTab(tab)
    setIsDocsOpen(true)
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none font-sans">
      {/* Top Header Navbar */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenDocs={handleOpenDocs}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenFrameExtractor={() => setIsFrameExtractorOpen(true)}
        onOpenHookFinder={() => setIsHookFinderOpen(true)}
      />

      {/* Main Content Area */}
      {activeView === 'onboarding' ? (
        <OnboardingGuide
          userProfile={userProfile}
          onOpenDocs={handleOpenDocs}
          onEnterStudio={() => setActiveView('studio')}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Main Workspace (Middle Section) */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Panel: Media Pool & Assets */}
            <div className="w-72 h-full">
              <MediaPool />
            </div>

            {/* Center Panel: Main Preview Video Player */}
            <div className="flex-1 h-full min-w-0">
              <PreviewViewport />
            </div>

            {/* Right Panel: Inspector & Properties Panel */}
            <div className="w-80 h-full">
              <Inspector />
            </div>
          </div>

          {/* Bottom Workspace: Multi-Track Timeline Editor */}
          <div className="h-64 shrink-0">
            <Timeline />
          </div>
        </div>
      )}

      {/* Built-in Documentation & Help Modal */}
      <BuiltInDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        initialTab={docsInitialTab}
      />

      {/* Analytics Modal Dialog */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        onOpenDocs={handleOpenDocs}
      />

      {/* Frame Extractor Modal Dialog */}
      <FrameExtractorModal
        isOpen={isFrameExtractorOpen}
        onClose={() => setIsFrameExtractorOpen(false)}
      />

      {/* AI Hook Finder Modal Dialog */}
      <HookFinderModal
        isOpen={isHookFinderOpen}
        onClose={() => setIsHookFinderOpen(false)}
      />
    </div>
  )
}

export default App
