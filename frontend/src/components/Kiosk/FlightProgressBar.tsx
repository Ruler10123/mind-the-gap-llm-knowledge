import { useState } from 'react'
import { Plane, CheckCircle, Users, Coffee, Luggage, DoorOpen, MapPin, Clock, AlertCircle, Package } from 'lucide-react'

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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const phases = [
    {
      id: 'checkin',
      label: 'Check-in',
      icon: Users,
      info: {
        title: 'Check-in Status',
        items: [
          { label: 'Counter Status', value: 'Open - Desks 15-18', status: 'success' },
          { label: 'Mobile Check-in', value: 'Completed', status: 'success' },
          { label: 'Checked Bags', value: '2 bags ($80 total)', status: 'info' },
          { label: 'Additional Bags', value: 'Add for $150', status: 'warning' },
          { label: 'Boarding Pass', value: 'In Mobile App', status: 'success' },
          { label: 'ID Verification', value: 'Required at Gate', status: 'info' },
        ]
      }
    },
    {
      id: 'security',
      label: 'Security',
      icon: CheckCircle,
      info: {
        title: 'TSA Security Checkpoint',
        items: [
          { label: 'Wait Time', value: '~15 min (Standard)', status: 'warning' },
          { label: 'TSA PreCheck', value: '<5 min wait', status: 'success' },
          { label: 'Checkpoint Location', value: 'Terminal D - South', status: 'info' },
          { label: 'PreCheck Lane', value: 'Lane 3 (Eligible)', status: 'success' },
          { label: 'Items to Remove', value: 'Laptops, liquids, shoes', status: 'info' },
          { label: 'Recommended Arrival', value: '30 min before boarding', status: 'warning' },
        ]
      }
    },
    {
      id: 'lounge',
      label: 'Lounge',
      icon: Coffee,
      info: {
        title: 'Admirals Club Lounge',
        items: [
          { label: 'Access Level', value: 'Premium (Granted)', status: 'success' },
          { label: 'Location', value: 'Concourse D, Gate D18', status: 'info' },
          { label: 'Hours Today', value: '5:00 AM - 10:00 PM', status: 'info' },
          { label: 'Amenities', value: 'Bar, Hot Food, Showers', status: 'success' },
          { label: 'Capacity', value: 'Moderate - Seats Available', status: 'success' },
          { label: 'Guest Passes', value: '2 available for purchase', status: 'info' },
        ]
      }
    },
    {
      id: 'gate',
      label: 'Gate',
      icon: DoorOpen,
      info: {
        title: 'Gate & Boarding Info',
        items: [
          { label: 'Gate Number', value: flight.gate + ' (Confirmed)', status: 'success' },
          { label: 'Boarding Starts', value: flight.boardingTime, status: 'warning' },
          { label: 'Boarding Group', value: 'Group 3 (Main Cabin)', status: 'info' },
          { label: 'Flight Status', value: flight.status, status: 'success' },
          { label: 'Aircraft Type', value: 'Boeing 737-800', status: 'info' },
          { label: 'Distance to Gate', value: '8 min walk from security', status: 'info' },
        ]
      }
    },
    {
      id: 'boarding',
      label: 'Boarding',
      icon: Luggage,
      info: {
        title: 'Boarding Progress',
        items: [
          { label: 'Your Group', value: 'Group 3 - Now Boarding', status: 'success' },
          { label: 'Seat Assignment', value: '12F (Window)', status: 'info' },
          { label: 'Bags Loaded', value: '1 of 2 loaded', status: 'warning' },
          { label: 'Remaining Bag', value: 'Loading in 5 min', status: 'warning' },
          { label: 'Mobile Boarding Pass', value: 'Ready to Scan', status: 'success' },
          { label: 'Estimated Departure', value: flight.departureTime + ' (On Time)', status: 'success' },
        ]
      }
    },
    {
      id: 'departed',
      label: 'In Flight',
      icon: Plane,
      info: {
        title: 'In-Flight Services',
        items: [
          { label: 'Flight Duration', value: '3h 30m', status: 'info' },
          { label: 'Estimated Arrival', value: '4:15 PM CST', status: 'info' },
          { label: 'Wi-Fi Access', value: 'Premium Plan ($19)', status: 'success' },
          { label: 'In-Flight Entertainment', value: 'Streaming Available', status: 'success' },
          { label: 'Meal Service', value: 'Vegetarian Pasta', status: 'info' },
          { label: 'Flight Tracker', value: 'Live Map in App', status: 'info' },
        ]
      }
    },
    {
      id: 'arrived',
      label: 'Arrived',
      icon: MapPin,
      info: {
        title: 'Arrival & Next Steps',
        items: [
          { label: 'Arrival Status', value: 'Landed - Gate C12', status: 'success' },
          { label: 'Baggage Claim', value: 'Belt 3 - Level 1', status: 'info' },
          { label: 'Bag 1', value: 'Claimed', status: 'success' },
          { label: 'Bag 2', value: 'On Carousel', status: 'warning' },
          { label: 'Ground Transport', value: 'Rideshare: Level 1, Door 3', status: 'info' },
          { label: 'Next Flight', value: 'No connections today', status: 'info' },
        ]
      }
    },
  ]

  const currentPhaseIndex = phases.findIndex((p) => p.id === flight.currentPhase)

  const handlePhaseClick = (e: React.MouseEvent, phaseId: string, index: number) => {
    e.stopPropagation()
    // Only allow clicking on completed or current phases
    if (index <= currentPhaseIndex) {
      setOpenDropdown(openDropdown === phaseId ? null : phaseId)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-amber-600'
      case 'info': return 'text-[#0E1F34]'
      default: return 'text-gray-600'
    }
  }

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
        <div className={`${showProgressOnly ? 'w-full' : 'flex-1'} flex items-center gap-1 relative`}>
          {phases.map((phase, index) => {
            const isComplete = index < currentPhaseIndex
            const isCurrent = index === currentPhaseIndex
            const isUpcoming = index > currentPhaseIndex
            const Icon = phase.icon
            const isClickable = index <= currentPhaseIndex
            const isOpen = openDropdown === phase.id

            return (
              <div key={phase.id} className="flex items-center flex-1 relative">
                {/* Phase marker */}
                <div className="flex flex-col items-center gap-1 min-w-fit relative">
                  <div
                    onClick={(e) => handlePhaseClick(e, phase.id, index)}
                    className={`
                      ${isCompact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center transition-all duration-300
                      ${isComplete ? 'bg-[#C8102E]' : ''}
                      ${isCurrent ? 'bg-[#C8102E] ring-2 ring-[#C8102E]/30' : ''}
                      ${isUpcoming ? 'bg-white/20' : ''}
                      ${isClickable ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : 'cursor-not-allowed'}
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

                  {/* Dropdown */}
                  {isOpen && (
                    <div className="absolute top-full mt-3 z-50 min-w-[340px] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-2xl">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-br from-[#0E1F34] to-[#1a3a5c] px-4 py-3 border-b border-white/20">
                          <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <Icon className="w-4 h-4 text-[#C8102E]" />
                            {phase.info.title}
                          </h3>
                        </div>
                        {/* Content */}
                        <div className="p-4 space-y-2">
                          {phase.info.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/20 border border-white/30 hover:bg-white/30 transition-colors">
                              <span className="text-xs font-light text-[#0E1F34]">{item.label}</span>
                              <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
