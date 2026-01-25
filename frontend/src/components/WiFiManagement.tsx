import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Wifi, Info, Check, Zap } from 'lucide-react'

interface WiFiPlan {
  id: string
  name: string
  description: string
  speed: string
  price: number
  features: string[]
}

interface WiFiManagementProps {
  hasPurchased?: boolean
  currentPlan?: string
  flightNumber?: string
  onPurchase?: (planId: string) => void
  onClose?: () => void
  aiMode?: boolean
}

const WIFI_PLANS: WiFiPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for messaging and light browsing',
    speed: 'Up to 2 Mbps',
    price: 12,
    features: [
      'Email and messaging',
      'Social media',
      'Web browsing',
      'Valid for this flight only',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Stream, work, and browse with ease',
    speed: 'Up to 10 Mbps',
    price: 19,
    features: [
      'Everything in Basic',
      'HD video streaming',
      'Video calls',
      'Fast downloads',
      'Valid for this flight only',
    ],
  },
  {
    id: 'day-pass',
    name: 'Day Pass',
    description: 'Unlimited access for 24 hours',
    speed: 'Up to 10 Mbps',
    price: 29,
    features: [
      'All Premium features',
      'Valid for 24 hours',
      'Use on multiple flights',
      'Priority connection',
    ],
  },
]

export function WiFiManagement({
  hasPurchased = false,
  currentPlan = '',
  flightNumber = 'AA 2847',
  onPurchase,
  onClose,
  aiMode = false,
}: WiFiManagementProps) {
  const [purchased, setPurchased] = useState(hasPurchased)
  const [selectedPlan, setSelectedPlan] = useState(currentPlan)

  const handlePurchase = (planId: string) => {
    const plan = WIFI_PLANS.find(p => p.id === planId)
    if (!plan) return

    setPurchased(true)
    setSelectedPlan(planId)
    toast.success(`${plan.name} Wi-Fi purchased!`, {
      description: `Connect to "AA-Inflight" network. Charged $${plan.price}`,
    })
    onPurchase?.(planId)
  }

  const currentPlanData = WIFI_PLANS.find(p => p.id === selectedPlan)

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wifi className="w-6 h-6 text-[#C8102E]" />
                <h2 className="text-2xl font-light text-[#0E1F34]">In-Flight Wi-Fi</h2>
              </div>
              <p className="text-sm font-light text-gray-600">
                Flight {flightNumber}
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

        {/* Current Status */}
        {purchased && currentPlanData && (
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-green-50/40 border border-green-200/60 shadow-xl p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <p className="text-lg font-light text-green-900">Wi-Fi Active</p>
                </div>
                <h3 className="text-3xl font-light text-[#0E1F34] mb-2">
                  {currentPlanData.name} Plan
                </h3>
                <p className="text-sm font-light text-gray-600 mb-3">
                  {currentPlanData.description}
                </p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-light text-gray-700">
                    {currentPlanData.speed}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-light text-gray-600 mb-1">Network</p>
                <p className="text-xl font-light text-[#0E1F34]">AA-Inflight</p>
              </div>
            </div>
          </div>
        )}

        {/* WiFi Plans */}
        {!purchased && (
          <div className="space-y-3">
            <h3 className="text-lg font-light text-[#0E1F34] px-2">Select a Plan</h3>
            {WIFI_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6 hover:bg-white/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-light text-[#0E1F34] mb-1">{plan.name}</h4>
                    <p className="text-sm font-light text-gray-600">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-light text-[#C8102E]">${plan.price}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-light text-gray-700">{plan.speed}</span>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-light text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(plan.id)}
                  className="w-full px-6 py-3 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg"
                >
                  Purchase {plan.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Already Purchased - Show Connection Details */}
        {purchased && currentPlanData && (
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
            <h3 className="text-lg font-light text-[#0E1F34] mb-4">Connection Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="text-sm font-light text-gray-600">Network Name</span>
                <span className="text-sm font-light text-[#0E1F34]">AA-Inflight</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="text-sm font-light text-gray-600">Plan Type</span>
                <span className="text-sm font-light text-[#0E1F34]">{currentPlanData.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="text-sm font-light text-gray-600">Speed</span>
                <span className="text-sm font-light text-[#0E1F34]">{currentPlanData.speed}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-light text-gray-600">Status</span>
                <span className="text-sm font-light text-green-600">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-blue-50/40 border border-blue-200/60 shadow-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-light text-gray-700">
                Wi-Fi becomes available once the aircraft reaches cruising altitude. Connect to "AA-Inflight" network and follow the prompts.
              </p>
              {aiMode && (
                <p className="text-xs font-light text-blue-600 mt-2">
                  AI can recommend the best plan based on your expected usage during the flight.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
