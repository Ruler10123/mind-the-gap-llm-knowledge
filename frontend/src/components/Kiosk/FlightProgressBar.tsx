import { Plane, CheckCircle, Users, Coffee, Luggage, DoorOpen, MapPin } from 'lucide-react'

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

interface FlightProgressBarProps {
  flight: SimplifiedFlight
  isCompact?: boolean
  onClick?: () => void
  showProgressOnly?: boolean
}

export function FlightProgressBar({ flight, isCompact = false, onClick, showProgressOnly = false }: FlightProgressBarProps) {
  const phases = [
    { id: 'checkin', label: 'Check-in', icon: Users },
    { id: 'security', label: 'Security', icon: CheckCircle },
    { id: 'lounge', label: 'Lounge', icon: Coffee },
    { id: 'gate', label: 'Gate', icon: DoorOpen },
    { id: 'boarding', label: 'Boarding', icon: Luggage },
    { id: 'departed', label: 'In Flight', icon: Plane },
    { id: 'arrived', label: 'Arrived', icon: MapPin },
  ]

  const currentPhaseIndex = phases.findIndex((p) => p.id === flight.currentPhase)

  return (
    <div
      onClick={onClick}
      className={`w-full pointer-events-auto transition-all duration-300 ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${isCompact ? 'py-0' : 'py-3 px-6'}`}
    >
      <div className={`${isCompact ? '' : 'max-w-7xl mx-auto'} flex items-center ${isCompact ? 'gap-6' : 'gap-4'}`}>
        {!showProgressOnly && (
          <>
            {/* Flight Info - Compact Inline (always show in header) */}
            <div className="flex items-center gap-4 min-w-fit">
              <div className="text-left">
                <h2 className={`${isCompact ? 'text-lg' : 'text-xl'} font-medium text-[#0E1F34]`}>{flight.flightNumber}</h2>
                <p className={`${isCompact ? 'text-xs' : 'text-xs'} text-gray-600`}>{flight.origin} → {flight.destination}</p>
              </div>
              <div className={`${isCompact ? 'h-8' : 'h-8'} w-px bg-white/20`} />
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className={`${isCompact ? 'text-[10px]' : 'text-[9px]'} text-gray-500 uppercase`}>Boarding</p>
                  <p className={`${isCompact ? 'text-sm' : 'text-sm'} font-medium text-[#0E1F34]`}>{flight.boardingTime}</p>
                </div>
                <div className="text-left">
                  <p className={`${isCompact ? 'text-[10px]' : 'text-[9px]'} text-gray-500 uppercase`}>Departure</p>
                  <p className={`${isCompact ? 'text-sm' : 'text-sm'} font-medium text-[#0E1F34]`}>{flight.departureTime}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Progress Track - Horizontal */}
        <div className={`${showProgressOnly ? 'w-full' : 'flex-1'} flex items-center gap-1`}>
          {phases.map((phase, index) => {
            const isComplete = index < currentPhaseIndex
            const isCurrent = index === currentPhaseIndex
            const isUpcoming = index > currentPhaseIndex
            const Icon = phase.icon

            return (
              <div key={phase.id} className="flex items-center flex-1">
                {/* Phase marker */}
                <div className="flex flex-col items-center gap-1 min-w-fit">
                  <div
                    className={`
                      ${isCompact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center transition-all duration-300
                      ${isComplete ? 'bg-[#C8102E]' : ''}
                      ${isCurrent ? 'bg-[#C8102E] ring-2 ring-[#C8102E]/30' : ''}
                      ${isUpcoming ? 'bg-white/20' : ''}
                    `}
                  >
                    <Icon
                      className={`
                        ${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-colors
                        ${isComplete || isCurrent ? 'text-white' : 'text-gray-400'}
                      `}
                    />
                  </div>
                  <span
                    className={`
                      ${isCompact ? 'text-[10px]' : 'text-[11px]'} font-light whitespace-nowrap
                      ${isCurrent ? 'text-[#C8102E] font-medium' : 'text-gray-500'}
                    `}
                  >
                    {phase.label}
                  </span>
                </div>

                {/* Connector line (except for last item) */}
                {index < phases.length - 1 && (
                  <div className={`flex-1 ${isCompact ? 'h-0.5 mx-1.5' : 'h-0.5 mx-1'} bg-white/20`}>
                    <div
                      className={`h-full transition-all duration-500 ${
                        isComplete ? 'bg-[#C8102E] w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
