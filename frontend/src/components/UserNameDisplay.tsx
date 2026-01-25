import { useEffect, useState } from 'react'
import { User } from 'lucide-react'

interface UserData {
  name: string
  passenger_id: string
  ticket_info: {
    flight_number: string
    seat: string
    group: string
  }
  status: {
    boarded: boolean
  }
}

export default function UserNameDisplay() {
  const [user, setUser] = useState<UserData | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const userData = JSON.parse(userStr) as UserData
          setUser(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error)
        setUser(null)
      }
    }

    // Load initially
    loadUser()

    // Listen for storage changes (when user authenticates in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadUser()
    }

    window.addEventListener('userAuthenticated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userAuthenticated', handleCustomStorageChange)
    }
  }, [])

  // Poll localStorage periodically to catch updates from same tab
  // (since storage events don't fire in the same tab)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const userData = JSON.parse(userStr) as UserData
          setUser((prev) => {
            // Only update if data actually changed
            if (!prev || prev.name !== userData.name) {
              return userData
            }
            return prev
          })
        } else {
          setUser((prev) => (prev ? null : prev))
        }
      } catch (error) {
        // Silently handle errors
      }
    }, 500) // Check every 500ms

    return () => clearInterval(interval)
  }, [])

  if (!user) return null

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/90 hover:bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-lg transition-all duration-200 shadow-lg">
        <User size={20} className="text-blue-400" />
        <span className="text-white font-medium text-sm">{user.name}</span>
      </div>
    </div>
  )
}

