import { useState } from 'react'
import { X } from 'lucide-react'
import { LuggageState, FlightStatus } from '@/types/flight'
import { useCreateFlight } from '@/hooks/useFlights'
import { StatusSelector } from './StatusSelector'
import { LuggageSelector } from './LuggageSelector'

interface FlightFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function FlightForm({ onSuccess, onCancel }: FlightFormProps) {
  const createFlight = useCreateFlight()
  const [formData, setFormData] = useState({
    flight_number: '',
    departure_location: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    flight_status: FlightStatus.ON_TIME,
    luggage_state: LuggageState.IDLE,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createFlight.mutateAsync({
        flight_number: formData.flight_number,
        departure_location: formData.departure_location,
        destination: formData.destination,
        departure_time: formData.departure_time,
        arrival_time: formData.arrival_time,
        flight_status: formData.flight_status,
        luggage_state: formData.luggage_state,
      })
      onSuccess()
    } catch (error) {
      console.error('Failed to create flight:', error)
      alert(`Failed to create flight: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="mb-6 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-cyan-400/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Create New Flight</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Flight Number */}
        <div>
          <label className="text-sm text-white/80 mb-2 block">Flight Number</label>
          <input
            type="text"
            value={formData.flight_number}
            onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
            required
            placeholder="e.g., AA1234"
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Route */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/80 mb-2 block">From</label>
            <input
              type="text"
              value={formData.departure_location}
              onChange={(e) => setFormData({ ...formData, departure_location: e.target.value })}
              required
              placeholder="DFW"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-sm text-white/80 mb-2 block">To</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
              placeholder="LAX"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/80 mb-2 block">Departure Time</label>
            <input
              type="datetime-local"
              value={formData.departure_time}
              onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-sm text-white/80 mb-2 block">Arrival Time</label>
            <input
              type="datetime-local"
              value={formData.arrival_time}
              onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Status Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/80 mb-2 block">Flight Status</label>
            <StatusSelector
              value={formData.flight_status}
              onChange={(value) => setFormData({ ...formData, flight_status: value })}
            />
          </div>
          <div>
            <label className="text-sm text-white/80 mb-2 block">Luggage State</label>
            <LuggageSelector
              value={formData.luggage_state}
              onChange={(value) => setFormData({ ...formData, luggage_state: value })}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createFlight.isPending}
          className="w-full py-3 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createFlight.isPending ? 'Creating...' : 'Create Flight'}
        </button>
      </form>
    </div>
  )
}
