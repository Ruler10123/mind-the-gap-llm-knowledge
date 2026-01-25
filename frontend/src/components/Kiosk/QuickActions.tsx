import { MapPin, Calendar, AlertCircle } from 'lucide-react'

interface QuickActionsProps {
  isVisible: boolean
  onActionClick?: (action: string) => void
  isFlightDelayed?: boolean
}

export function QuickActions({ isVisible, onActionClick, isFlightDelayed = false }: QuickActionsProps) {
  if (!isVisible) return null

  // Conditionally show delay action only if flight is delayed
  const actions = [
    ...(isFlightDelayed ? [{ id: 'delay', label: 'Flight delay info', icon: AlertCircle }] : []),
    { id: 'gate', label: 'Gate navigation', icon: MapPin },
    { id: 'reschedule', label: 'Flight Info', icon: Calendar },
  ]

  return (
    <div className="flex items-center justify-center gap-4 mt-6 animate-fade-in pointer-events-auto">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            onClick={() => onActionClick?.(action.id)}
            className="
              flex items-center gap-3
              px-6 py-4
              bg-white/10 backdrop-blur-xl
              border border-white/20
              rounded-full
              shadow-lg
              text-[#0E1F34]
              font-semibold
              text-base
              transition-all duration-300
              hover:bg-white/25
              hover:shadow-2xl
              hover:scale-110
              hover:border-[#C8102E]/30
              hover:-translate-y-1
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-[#C8102E]/50
              group
            "
          >
            <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            <span className="transition-all duration-300 group-hover:tracking-wide">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
