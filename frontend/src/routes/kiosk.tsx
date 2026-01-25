import { createFileRoute, redirect } from '@tanstack/react-router'
import { KioskLayout } from '@/components/Kiosk/KioskLayout'
import type { UserProfile } from '@/components/Kiosk/types'
import { isAuthenticated, getAuthenticatedUser, transformToUserProfile } from '@/utils/auth'

export const Route = createFileRoute('/kiosk')({
  beforeLoad: async ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
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
  // Get authenticated user from localStorage
  const storedUser = getAuthenticatedUser()
  const user = storedUser ? transformToUserProfile(storedUser) : mockUser

  // Keep mock flight data for now (future: fetch from API)
  const flight = mockFlight

  return (
    <div className="fixed inset-0 z-50">
      <KioskLayout user={user} flight={flight} />
    </div>
  )
}
