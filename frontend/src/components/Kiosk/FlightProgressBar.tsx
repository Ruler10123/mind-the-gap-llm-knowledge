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
      {/* Flight Header - Detailed */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-[#C8102E]/10">
              <Plane className="w-6 h-6 text-[#C8102E]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#0E1F34]">
                {flight.flightNumber}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {flight.origin} → {flight.destination}
              </p>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Gate</p>
                <p className="text-sm font-semibold text-[#0E1F34]">{flight.gate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Boarding</p>
                <p className="text-sm font-semibold text-[#0E1F34]">{flight.boardingTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Departure</p>
                <p className="text-sm font-semibold text-[#0E1F34]">{flight.departureTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
          <span
            className={`
              px-4 py-2 rounded-full text-sm font-semibold
              ${
                flight.status === 'On Time'
                  ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                  : 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
              }
            `}
          >
            {flight.status}
          </span>
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
