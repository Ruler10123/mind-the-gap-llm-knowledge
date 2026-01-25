import { Globe, Clock } from 'lucide-react'
import type { UserProfile } from './types'

interface KioskHeaderProps {
  user?: UserProfile
  currentTime: Date
  className?: string
}

export function KioskHeader({ user, currentTime, className = '' }: KioskHeaderProps) {
  const formatTime = (date: Date) => {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return timeStr
  }

  return (
    <header className={`bg-transparent ${className}`}>
      <div className="h-full px-12 flex items-center justify-between">
        {/* Left: AA Logo */}
        <img
          src="/americanairlineslogo.png"
          alt="American Airlines"
          className="h-20 md:h-24 lg:h-28 object-contain"
        />

        {/* Right: Language + Time + Profile Circle */}
        {user && (
          <div className="flex items-center gap-4 md:gap-6">
            {/* Language */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
              <Globe className="w-4 h-4 text-[#0E1F34]" />
              <span className="text-[#0E1F34] text-sm font-medium">EN</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20">
              <Clock className="w-4 h-4 text-[#0E1F34]" />
              <span className="text-[#0E1F34] text-sm font-medium">
                {formatTime(currentTime)} {user.timezone}
              </span>
            </div>

            {/* Profile Circle */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ED7B7B 0%, #A01D22 100%)'
              }}
            >
              <span className="text-white text-sm font-normal">{user.initials}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
