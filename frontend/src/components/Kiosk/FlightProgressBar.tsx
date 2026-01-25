import { Plane, Clock, MapPin, Users, Briefcase } from 'lucide-react'

interface SimplifiedFlight {
  flightNumber: string
  origin: string
  destination: string
  gate: string
  boardingTime: string
  departureTime: string
  status: string
  progress: number
  currentPhase: 'checkin' | 'boarding' | 'departed' | 'arrived'
}

interface FlightProgressBarProps {
  flight: SimplifiedFlight
  isCompact?: boolean
  onClick?: () => void
}

export function FlightProgressBar({ flight, isCompact = false, onClick }: FlightProgressBarProps) {
  const phases = [
    { id: 'checkin', label: 'Check-in', icon: Users },
    { id: 'boarding', label: 'Boarding', icon: Briefcase },
    { id: 'departed', label: 'In Flight', icon: Plane },
    { id: 'arrived', label: 'Arrived', icon: MapPin },
  ]

  const currentPhaseIndex = phases.findIndex((p) => p.id === flight.currentPhase)

  return (
    <div
      onClick={onClick}
      className={`
        w-full max-w-4xl mx-auto
        bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20
        ${isCompact ? 'p-5' : 'p-8'}
        transition-all duration-300
        hover:shadow-2xl hover:bg-white/15 cursor-pointer
        group
      `}
    >
      {/* Flight Header - Simplified */}
      <div className="text-center mb-6">
        <h2 className="text-4xl md:text-5xl font-bold text-[#0E1F34] mb-2">
          {flight.flightNumber}
        </h2>
        <p className="text-xl md:text-2xl text-gray-700 font-medium mb-4">
          {flight.origin} → {flight.destination}
        </p>

        {/* Quick Info - Larger and more readable */}
        <div className="flex items-center justify-center gap-8 md:gap-12 mt-6">
          <div className="text-center">
            <MapPin className="w-6 h-6 text-[#C8102E] mx-auto mb-1" />
            <p className="text-xs text-gray-500 uppercase tracking-wide">Gate</p>
            <p className="text-2xl font-bold text-[#0E1F34]">{flight.gate}</p>
          </div>
          <div className="text-center">
            <Clock className="w-6 h-6 text-[#C8102E] mx-auto mb-1" />
            <p className="text-xs text-gray-500 uppercase tracking-wide">Boarding</p>
            <p className="text-2xl font-bold text-[#0E1F34]">{flight.boardingTime}</p>
          </div>
          <div className="text-center">
            <Plane className="w-6 h-6 text-[#C8102E] mx-auto mb-1" />
            <p className="text-xs text-gray-500 uppercase tracking-wide">Departure</p>
            <p className="text-2xl font-bold text-[#0E1F34]">{flight.departureTime}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar - Enhanced */}
      <div className="relative">
        {/* Background track */}
        <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-[#C8102E] to-[#d93654] transition-all duration-500 shadow-lg"
            style={{ width: `${flight.progress}%` }}
          />
        </div>

        {/* Phase markers */}
        <div className="flex justify-between mt-4">
          {phases.map((phase, index) => {
            const isComplete = index < currentPhaseIndex
            const isCurrent = index === currentPhaseIndex
            const isUpcoming = index > currentPhaseIndex
            const Icon = phase.icon

            return (
              <div key={phase.id} className="flex flex-col items-center gap-2">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${isComplete ? 'bg-[#C8102E] scale-110' : ''}
                    ${isCurrent ? 'bg-[#C8102E] scale-125 animate-pulse shadow-lg shadow-[#C8102E]/50' : ''}
                    ${isUpcoming ? 'bg-white/20 backdrop-blur-sm' : ''}
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5 transition-colors
                      ${isComplete || isCurrent ? 'text-white' : 'text-gray-400'}
                    `}
                  />
                </div>
                <span
                  className={`
                    text-xs font-medium
                    ${isCurrent ? 'text-[#C8102E] font-semibold' : 'text-gray-600'}
                  `}
                >
                  {phase.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Expandable hint */}
      {!isCompact && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Tap for detailed flight information
          </p>
        </div>
      )}
    </div>
  )
}
