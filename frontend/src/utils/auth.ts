/**
 * Authentication utilities for user session management
 */

export interface StoredUser {
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

export interface UserProfile {
  name: string
  initials: string
  timezone: string
}

export const AUTH_STORAGE_KEY = 'user'
export const AUTH_EVENT_NAME = 'userAuthenticated'

/**
 * Get the authenticated user from localStorage
 * @returns StoredUser object or null if not authenticated
 */
export function getAuthenticatedUser(): StoredUser | null {
  try {
    const userJson = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!userJson) return null

    const user = JSON.parse(userJson) as StoredUser
    return user
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error)
    return null
  }
}

/**
 * Check if a user is currently authenticated
 * @returns true if user is logged in, false otherwise
 */
export function isAuthenticated(): boolean {
  return getAuthenticatedUser() !== null
}

/**
 * Store authenticated user in localStorage
 * @param user - User data from authentication API
 */
export function setAuthenticatedUser(user: StoredUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))

    // Dispatch custom event for listeners
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: user }))
  } catch (error) {
    console.error('Failed to store user in localStorage:', error)
  }
}

/**
 * Clear authentication data from localStorage
 */
export function clearAuthentication(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)

    // Dispatch custom event for listeners
    window.dispatchEvent(new Event('userLoggedOut'))
  } catch (error) {
    console.error('Failed to clear authentication:', error)
  }
}

/**
 * Transform stored user data to UserProfile format for kiosk
 * @param user - StoredUser from localStorage
 * @returns UserProfile with name, initials, and timezone
 */
export function transformToUserProfile(user: StoredUser): UserProfile {
  // Generate initials from name (e.g., "Jane Smith" -> "JS")
  const nameParts = user.name.trim().split(/\s+/)
  const initials = nameParts
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) // Take first 2 characters max

  return {
    name: user.name,
    initials: initials || '??',
    timezone: 'CT' // Default timezone, could be enhanced to detect user's actual timezone
  }
}
