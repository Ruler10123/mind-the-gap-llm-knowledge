export type FlightStatus = 'on-time' | 'delayed' | 'boarding' | 'departed'
export type TimelineState = 'complete' | 'in-progress' | 'upcoming' | 'blocked'
export type KioskMode = 'passive' | 'listening' | 'result'
export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing'

export interface Airport {
  code: string        // "DFW"
  name: string        // "Dallas/Fort Worth"
  gate: string        // "D24"
  terminal?: string   // "D"
}

export interface TimelineStepData {
  id: string
  label: string
  state: TimelineState
  icon: string        // lucide-react icon name
  metadata?: {
    count?: number
    total?: number
    detail?: string
    percentage?: number
  }
}

export interface FlightData {
  flightNumber: string
  airline: string
  origin: Airport
  destination: Airport
  aircraft: string
  seat: string
  scheduledDeparture: Date
  estimatedDeparture: Date
  scheduledArrival: Date
  estimatedArrival: Date
  status: FlightStatus
  delayMinutes: number
  delayReasonCategory: string
  delayReasonDetail: string
  nextUpdateMinutes: number
  timeline: TimelineStepData[]
  boardingGroupCurrent: number
  boardingCounts: Record<number, number>
}

export interface WeatherData {
  temperature: number
  unit: 'F' | 'C'
  condition: string
  icon: string  // lucide-react icon name
}

export interface UserData {
  name: string
  avatar?: string
}

export interface UserProfile {
  name: string
  initials: string
  timezone: string
}

export interface FlightDetails {
  flightNumber: string       // "AA 2451"
  date: string              // "Jan 24, 2026"
  departureTime: string     // "3:00 PM"
  arrivalTime: string       // "5:30 PM"
  origin: string           // "DFW"
  destination: string      // "LAX"
  gate: string            // "D24"
}

export interface CompensationOffer {
  type: 'both' | 'choice'          // 'both' = receive both, 'choice' = select one
  cashAmount?: number              // e.g., 400 (dollars)
  creditsAmount?: number           // e.g., 600 (airline miles/credits)
  creditsExpiryMonths?: number     // e.g., 12 months
}

export interface OverbookingOffer {
  id: string
  reason: string                   // "Flight Overbooked"
  reasonDetail: string             // "More passengers checked in than available seats"
  originalFlight: FlightDetails
  newFlight: FlightDetails
  compensation: CompensationOffer
  expiresAt?: string              // Optional: ISO date string for urgency
}
