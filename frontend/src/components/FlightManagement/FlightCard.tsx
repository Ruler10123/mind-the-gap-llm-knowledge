import { useState, useEffect } from 'react'
import { Plane, Clock, MapPin, Trash2, Package } from 'lucide-react'
import type { Flight, LuggageState, FlightStatus } from '@/types/flight'
import { useUpdateFlight, useDeleteFlight } from '@/hooks/useFlights'
import { StatusSelector } from './StatusSelector'
import { LuggageSelector } from './LuggageSelector'

interface FlightCardProps {
  flight: Flight
}

export function FlightCard({ flight }: FlightCardProps) {
  const updateFlight = useUpdateFlight()
  const deleteFlight = useDeleteFlight()
  const [isDeleting, setIsDeleting] = useState(false)
  const [localDeparture, setLocalDeparture] = useState(flight.departure_location)
  const [localDestination, setLocalDestination] = useState(flight.destination)

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toDateTimeLocalValue = (isoString: string) => {
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Sync local state when flight prop changes
  useEffect(() => {
    setLocalDeparture(flight.departure_location)
    setLocalDestination(flight.destination)
  }, [flight.departure_location, flight.destination])

  const handleStatusChange = (newStatus: FlightStatus) => {
    updateFlight.mutate({
      id: flight.id,
      data: { flight_status: newStatus },
    })
  }

  const handleLuggageChange = (newState: LuggageState) => {
    updateFlight.mutate({
      id: flight.id,
      data: { luggage_state: newState },
    })
  }

  const handleRouteBlur = (field: 'departure_location' | 'destination', value: string) => {
    const trimmedValue = value.trim()
    if (trimmedValue && trimmedValue !== flight[field]) {
      updateFlight.mutate({
        id: flight.id,
        data: { [field]: trimmedValue },
      })
    } else if (!trimmedValue) {
      // Reset to original value if empty
      if (field === 'departure_location') {
        setLocalDeparture(flight.departure_location)
      } else {
        setLocalDestination(flight.destination)
      }
    }
  }

  const handleTimeChange = (field: 'departure_time' | 'arrival_time', value: string) => {
    if (value) {
      updateFlight.mutate({
        id: flight.id,
        data: { [field]: new Date(value).toISOString() },
      })
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete flight ${flight.flight_number}?`)) {
      setIsDeleting(true)
      deleteFlight.mutate(flight.id)
    }
  }

  return (
    <div className="p-5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-200">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold text-xl">{flight.flight_number}</h3>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting || deleteFlight.isPending}
          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
          title="Delete flight"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Flight Details */}
      <div className="space-y-3 mb-4">
        {/* Route - Editable */}
        <div>
          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Route
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={localDeparture}
              onChange={(e) => setLocalDeparture(e.target.value)}
              onBlur={(e) => handleRouteBlur('departure_location', e.target.value)}
              disabled={updateFlight.isPending}
              placeholder="From"
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            />
            <input
              type="text"
              value={localDestination}
              onChange={(e) => setLocalDestination(e.target.value)}
              onBlur={(e) => handleRouteBlur('destination', e.target.value)}
              disabled={updateFlight.isPending}
              placeholder="To"
              className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Times - Editable */}
        <div>
          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Times
          </label>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-white/40 mb-1">Departure</div>
              <input
                type="datetime-local"
                value={toDateTimeLocalValue(flight.departure_time)}
                onChange={(e) => handleTimeChange('departure_time', e.target.value)}
                disabled={updateFlight.isPending}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1">Arrival</div>
              <input
                type="datetime-local"
                value={toDateTimeLocalValue(flight.arrival_time)}
                onChange={(e) => handleTimeChange('arrival_time', e.target.value)}
                disabled={updateFlight.isPending}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Controls */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        {/* Flight Status */}
        <div>
          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 block">
            Flight Status
          </label>
          <StatusSelector
            value={flight.flight_status}
            onChange={handleStatusChange}
            disabled={updateFlight.isPending}
          />
        </div>

        {/* Luggage State */}
        <div>
          <label className="text-xs text-white/60 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Luggage State
          </label>
          <LuggageSelector
            value={flight.luggage_state}
            onChange={handleLuggageChange}
            disabled={updateFlight.isPending}
          />
        </div>
      </div>
    </div>
  )
}
