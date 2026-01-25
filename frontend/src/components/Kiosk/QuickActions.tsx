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
    { id: 'reschedule', label: 'Reschedule / Rebook', icon: Calendar },
  ]

  return (
    <div className="flex items-center justify-center gap-4 mt-6 animate-fade-in">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            onClick={() => onActionClick?.(action.id)}
            className="
              flex items-center gap-2
              px-5 py-3
              bg-white/10 backdrop-blur-xl
              border border-white/20
              rounded-full
              shadow-lg
              text-[#0E1F34]
              font-medium
              text-sm
              transition-all duration-200
              hover:bg-white/20
              hover:shadow-xl
              hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-[#C8102E]/50
            "
          >
            <Icon className="w-4 h-4" />
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
