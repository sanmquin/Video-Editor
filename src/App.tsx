import { Header } from './components/Header'
import { MediaPool } from './components/MediaPool'
import { PreviewViewport } from './components/PreviewViewport'
import { Inspector } from './components/Inspector'
import { Timeline } from './components/Timeline'

export function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden select-none font-sans">
      {/* Top Header Navbar */}
      <Header />

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
  )
}

export default App
