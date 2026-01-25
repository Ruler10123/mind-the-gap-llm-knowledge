import { createFileRoute } from '@tanstack/react-router'
import { KioskLayout } from '@/components/Kiosk/KioskLayout'
import type { UserProfile } from '@/components/Kiosk/types'

export const Route = createFileRoute('/kiosk')({
  component: KioskRoute,
})

// Simplified mock data for the new voice-first kiosk
const mockUser: UserProfile = {
  name: 'John Bui',
  initials: 'JB',
  timezone: 'CT'
}

const mockFlight = {
  flightNumber: 'AA 2847',
  origin: 'DFW',
  destination: 'LAX',
  gate: 'D24',
  boardingTime: '2:30 PM',
  departureTime: '3:00 PM',
  status: 'On Time',
  progress: 60,
  currentPhase: 'gate' as const
}

function KioskRoute() {
  return (
    <div className="fixed inset-0 z-50">
      <KioskLayout user={mockUser} flight={mockFlight} />
    </div>
  )
}
