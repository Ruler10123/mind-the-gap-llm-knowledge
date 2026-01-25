import { useState } from 'react'
import { SeatSelector } from './SeatSelector'
import { toast } from '@/lib/toast'
import {
  Armchair,
  UtensilsCrossed,
  Luggage,
  Wifi,
  ChevronRight,
  CheckCircle2
} from 'lucide-react'

interface QuickChangesProps {
  onClose?: () => void
}

interface QuickChangeOption {
  id: string
  title: string
  description: string
  icon: any
  currentValue?: string
  action: () => void
}

export function QuickChanges({ onClose }: QuickChangesProps) {
  const [showSeatSelector, setShowSeatSelector] = useState(false)
  const [currentSeat, setCurrentSeat] = useState('12C')
  const [currentMeal, setCurrentMeal] = useState('Vegetarian')
  const [wifiPurchased, setWifiPurchased] = useState(false)
  const [baggageCount, setBaggageCount] = useState(1)

  const handleSeatChange = (newSeat: string) => {
    setCurrentSeat(newSeat)
    setShowSeatSelector(false)
    toast.success(`Seat changed to ${newSeat}`, {
      description: 'Your boarding pass has been updated',
    })
  }

  const handleMealChange = () => {
    const meals = ['Vegetarian', 'Chicken', 'Beef', 'Pasta', 'Asian Vegetarian', 'No Meal']
    const currentIndex = meals.indexOf(currentMeal)
    const nextMeal = meals[(currentIndex + 1) % meals.length]
    setCurrentMeal(nextMeal)
    toast.success(`Meal preference updated to ${nextMeal}`, {
      description: 'Your selection has been saved',
    })
  }

  const handleBaggageAdd = () => {
    if (baggageCount < 3) {
      setBaggageCount(baggageCount + 1)
      toast.success(`Added checked bag #${baggageCount + 1}`, {
        description: `Additional charge: $35`,
      })
    } else {
      toast.error('Maximum baggage limit reached', {
        description: 'Contact customer service for additional bags',
      })
    }
  }

  const handleWifiPurchase = () => {
    if (!wifiPurchased) {
      setWifiPurchased(true)
      toast.success('Wi-Fi access purchased', {
        description: 'Connect to "AA-Inflight" network',
      })
    } else {
      toast.info('Wi-Fi already purchased', {
        description: 'You have full flight Wi-Fi access',
      })
    }
  }

  const quickChangeOptions: QuickChangeOption[] = [
    {
      id: 'seat',
      title: 'Change Seat',
      description: `Currently: ${currentSeat}`,
      icon: Armchair,
      currentValue: currentSeat,
      action: () => setShowSeatSelector(true),
    },
    {
      id: 'meal',
      title: 'Meal Preference',
      description: `Currently: ${currentMeal}`,
      icon: UtensilsCrossed,
      currentValue: currentMeal,
      action: handleMealChange,
    },
    {
      id: 'baggage',
      title: 'Add Checked Bag',
      description: `Current bags: ${baggageCount}`,
      icon: Luggage,
      currentValue: `${baggageCount} bag${baggageCount > 1 ? 's' : ''}`,
      action: handleBaggageAdd,
    },
    {
      id: 'wifi',
      title: 'In-Flight Wi-Fi',
      description: wifiPurchased ? 'Active for flight' : 'Purchase for $19',
      icon: Wifi,
      currentValue: wifiPurchased ? 'Purchased' : 'Not purchased',
      action: handleWifiPurchase,
    },
  ]

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-light text-[#0E1F34] mb-2">Quick Changes</h2>
                <p className="text-sm font-light text-gray-600">
                  Manage your flight preferences instantly
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Quick Change Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickChangeOptions.map((option) => {
              const Icon = option.icon
              const isPurchased = option.id === 'wifi' && wifiPurchased

              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6 hover:bg-white/40 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#C8102E]/10 group-hover:bg-[#C8102E]/20 transition-colors">
                      <Icon className="w-6 h-6 text-[#C8102E]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-light text-[#0E1F34]">{option.title}</h3>
                        {isPurchased ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#C8102E] transition-colors flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-light text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Trip Summary Card */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
            <h3 className="text-lg font-light text-[#0E1F34] mb-4">Current Trip Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="text-sm font-light text-gray-600">Seat Assignment</span>
                <span className="text-sm font-light text-[#0E1F34]">{currentSeat}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="text-sm font-light text-gray-600">Meal Preference</span>
                <span className="text-sm font-light text-[#0E1F34]">{currentMeal}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="text-sm font-light text-gray-600">Checked Bags</span>
                <span className="text-sm font-light text-[#0E1F34]">
                  {baggageCount} bag{baggageCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-light text-gray-600">Wi-Fi Access</span>
                <span className={`text-sm font-light ${wifiPurchased ? 'text-green-600' : 'text-gray-400'}`}>
                  {wifiPurchased ? 'Purchased' : 'Not purchased'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-blue-50/40 border border-blue-200/60 shadow-xl p-4">
            <p className="text-xs font-light text-gray-600 text-center">
              Changes are saved automatically to your profile. Updated boarding pass will be sent to your email.
            </p>
          </div>
        </div>
      </div>

      {/* Seat Selector Modal */}
      {showSeatSelector && (
        <SeatSelector
          currentSeat={currentSeat}
          onSelect={handleSeatChange}
          onClose={() => setShowSeatSelector(false)}
        />
      )}
    </>
  )
}
