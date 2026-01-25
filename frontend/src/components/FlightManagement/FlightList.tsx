import { FlightCard } from './FlightCard'
import type { Flight } from '@/types/flight'

interface FlightListProps {
  flights: Flight[]
  isLoading: boolean
}

export function FlightList({ flights, isLoading }: FlightListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-white/60 text-lg">Loading flights...</div>
      </div>
    )
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-white/60 text-lg">No flights found</div>
        <div className="text-white/40 text-sm mt-2">Create your first flight to get started</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flights.map((flight) => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  )
}
