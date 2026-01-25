/**
 * Example usage of OverbookingModal component
 *
 * This file demonstrates how to integrate the OverbookingModal
 * into a parent component or route.
 */

import { useState } from 'react'
import { OverbookingModal } from './OverbookingModal'
import type { OverbookingOffer } from './types'

export function OverbookingModalExample() {
  const [showOverbooking, setShowOverbooking] = useState(false)
  const [overbookingOffer, setOverbookingOffer] = useState<OverbookingOffer | null>(null)

  // Example mock data
  const mockOffer: OverbookingOffer = {
    id: "OVB-123456",
    reason: "Flight Overbooked",
    reasonDetail: "More passengers checked in than available seats due to aircraft change",
    originalFlight: {
      flightNumber: "AA 2451",
      date: "Jan 24, 2026",
      departureTime: "3:00 PM",
      arrivalTime: "5:30 PM",
      origin: "DFW",
      destination: "LAX",
      gate: "D24"
    },
    newFlight: {
      flightNumber: "AA 2901",
      date: "Jan 24, 2026",
      departureTime: "5:30 PM",
      arrivalTime: "7:15 PM",
      origin: "DFW",
      destination: "LAX",
      gate: "D18"
    },
    compensation: {
      type: "choice", // or "both"
      cashAmount: 400,
      creditsAmount: 600,
      creditsExpiryMonths: 12
    }
  }

  // Handler when user accepts the offer
  const handleAccept = (offerId: string, compensation?: 'cash' | 'credits') => {
    console.log('Accepted offer:', offerId, 'Compensation:', compensation)
    setShowOverbooking(false)
    // TODO: Make API call to backend to confirm acceptance
    // Example: await api.acceptOverbookingOffer(offerId, compensation)
  }

  // Handler when user declines the offer
  const handleDecline = (offerId: string) => {
    console.log('Declined offer:', offerId)
    setShowOverbooking(false)
    // TODO: Make API call to backend to record decline
    // Example: await api.declineOverbookingOffer(offerId)
  }

  // Trigger to show the modal (for testing)
  const showMockOffer = () => {
    setOverbookingOffer(mockOffer)
    setShowOverbooking(true)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OverbookingModal Example</h1>

      <button
        onClick={showMockOffer}
        className="px-6 py-3 bg-[#C8102E] text-white rounded-lg hover:bg-[#a00d26] transition-colors"
      >
        Show Overbooking Offer
      </button>

      {/* The Modal Component */}
      <OverbookingModal
        isOpen={showOverbooking}
        offer={overbookingOffer}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onClose={() => setShowOverbooking(false)}
      />
    </div>
  )
}

/**
 * Integration with WebSocket/Backend
 *
 * In a real implementation, you would trigger the modal when receiving
 * an overbooking offer from the backend:
 *
 * // Inside your WebSocket message handler or component that receives backend events:
 * useEffect(() => {
 *   const handleBackendMessage = (message: any) => {
 *     if (message.type === 'overbooking_offer') {
 *       setOverbookingOffer(message.data)
 *       setShowOverbooking(true)
 *     }
 *   }
 *
 *   // Subscribe to backend events
 *   websocket.on('message', handleBackendMessage)
 *
 *   return () => {
 *     websocket.off('message', handleBackendMessage)
 *   }
 * }, [])
 */
