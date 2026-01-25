import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Home, Menu, Orbit, Settings, X } from 'lucide-react'

export default function AssistantMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Menu button - top-right */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed top-6 right-6 z-20
          p-3 rounded-full
          backdrop-blur-md
          border border-white/10
          bg-black/30 hover:bg-black/40
          transition-all duration-300
        `}
        aria-label="Open menu"
      >
        <Menu size={20} className="text-white/70" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out menu */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-80 z-50
          backdrop-blur-xl bg-black/40
          border-l border-white/10
          shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 transition-all group',
            }}
          >
            <Home
              size={20}
              className="text-white/70 group-hover:text-white transition-colors"
            />
            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
              Home
            </span>
          </Link>

          <Link
            to="/assistant"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 transition-all group',
            }}
          >
            <Orbit
              size={20}
              className="text-white/70 group-hover:text-white transition-colors"
            />
            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
              Assistant
            </span>
          </Link>

          <button
            onClick={() => {
              // TODO: Add settings functionality
              console.log('Settings clicked')
              setIsOpen(false)
            }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all group w-full text-left"
          >
            <Settings
              size={20}
              className="text-white/70 group-hover:text-white transition-colors"
            />
            <span className="font-medium text-white/90 group-hover:text-white transition-colors">
              Settings
            </span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            3D Voice Assistant
          </p>
        </div>
      </aside>
    </>
  )
}
