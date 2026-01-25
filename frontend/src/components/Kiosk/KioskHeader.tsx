import { Globe, Clock } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { UserProfile } from './types'
import { FlightProgressBar } from './FlightProgressBar'
import { clearAuthentication } from '@/utils/auth'

interface SimplifiedFlight {
  flightNumber: string
  origin: string
  destination: string
  gate: string
  boardingTime: string
  departureTime: string
  status: string
  progress: number
  currentPhase: 'checkin' | 'security' | 'lounge' | 'gate' | 'boarding' | 'departed' | 'arrived'
}

interface KioskHeaderProps {
  user?: UserProfile
  currentTime: Date
  flight?: SimplifiedFlight
  className?: string
}

export function KioskHeader({ user, currentTime, flight, className = '' }: KioskHeaderProps) {
  const navigate = useNavigate()

  const formatTime = (date: Date) => {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    return timeStr
  }

  const handleLogout = () => {
    clearAuthentication()
    navigate({ to: '/login' })
  }

  return (
    <header className={`bg-transparent ${className}`}>
      <div className="h-full px-12 flex items-center justify-between gap-8">
        {/* Left: AA Logo */}
        <img
          src="/americanairlineslogo.png"
          alt="American Airlines"
          className="h-20 md:h-24 lg:h-28 object-contain flex-shrink-0"
        />

        {/* Center: Flight Progress Bar */}
        {flight && (
          <div className="flex-1 max-w-4xl">
            <FlightProgressBar flight={flight} isCompact={true} />
          </div>
        )}

        {/* Right: Language + Time + Profile Circle */}
        {user && (
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            {/* Language */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg active:scale-95">
              <Globe className="w-4 h-4 text-[#0E1F34]" />
              <span className="text-[#0E1F34] text-sm font-medium">EN</span>
            </button>

            {/* Time */}
            <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg active:scale-95">
              <Clock className="w-4 h-4 text-[#0E1F34]" />
              <span className="text-[#0E1F34] text-sm font-medium">
                {formatTime(currentTime)} {user.timezone}
              </span>
            </button>

            {/* Profile Circle */}
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ED7B7B 0%, #A01D22 100%)'
              }}
              title="Logout"
            >
              <span className="text-white text-sm font-normal">{user.initials}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
