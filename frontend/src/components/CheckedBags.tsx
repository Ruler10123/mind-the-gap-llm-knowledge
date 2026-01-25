import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Luggage, Info, Plus, Minus } from 'lucide-react'

interface BagDetails {
  id: number
  weight?: number
  fee: number
}

interface CheckedBagsProps {
  currentBags?: number
  flightNumber?: string
  onBagCountChange?: (newCount: number) => void
  onClose?: () => void
  aiMode?: boolean
}

const BAG_FEES = [
  { bag: 1, fee: 35 },
  { bag: 2, fee: 45 },
  { bag: 3, fee: 150 },
]

const MAX_BAGS = 3

export function CheckedBags({
  currentBags = 1,
  flightNumber = 'AA 2847',
  onBagCountChange,
  onClose,
  aiMode = false,
}: CheckedBagsProps) {
  const [bagCount, setBagCount] = useState(currentBags)

  const handleAddBag = () => {
    if (bagCount >= MAX_BAGS) {
      toast.error('Maximum baggage limit reached', {
        description: 'Contact customer service for additional bags',
      })
      return
    }

    const newCount = bagCount + 1
    const fee = BAG_FEES.find(b => b.bag === newCount)?.fee || 150

    setBagCount(newCount)
    toast.success(`Added checked bag #${newCount}`, {
      description: `Additional charge: $${fee}`,
    })
    onBagCountChange?.(newCount)
  }

  const handleRemoveBag = () => {
    if (bagCount <= 0) {
      toast.info('No bags to remove', {
        description: 'You currently have no checked bags',
      })
      return
    }

    const newCount = bagCount - 1
    const fee = BAG_FEES.find(b => b.bag === bagCount)?.fee || 0

    setBagCount(newCount)
    toast.success(`Removed checked bag #${bagCount}`, {
      description: newCount === 0 ? 'All bags removed' : `Refund: $${fee}`,
    })
    onBagCountChange?.(newCount)
  }

  const calculateTotalFees = () => {
    let total = 0
    for (let i = 1; i <= bagCount; i++) {
      total += BAG_FEES.find(b => b.bag === i)?.fee || 150
    }
    return total
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Luggage className="w-6 h-6 text-[#C8102E]" />
                <h2 className="text-2xl font-light text-[#0E1F34]">Checked Bags</h2>
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

        {/* Current Bag Count */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-light text-gray-600 mb-2">Current Checked Bags</p>
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-extralight text-[#0E1F34]">{bagCount}</p>
                <p className="text-lg font-light text-gray-600">
                  {bagCount === 0 ? 'No bags' : bagCount === 1 ? 'bag' : 'bags'}
                </p>
              </div>
              {bagCount > 0 && (
                <p className="text-sm font-light text-amber-600 mt-2">
                  Total fees: ${calculateTotalFees()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRemoveBag}
                disabled={bagCount === 0}
                className="p-4 rounded-full bg-white/40 border border-white/60 hover:bg-white/50 text-gray-700 font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-6 h-6" />
              </button>
              <button
                onClick={handleAddBag}
                disabled={bagCount >= MAX_BAGS}
                className="p-4 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Bag Fee Breakdown */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
          <h3 className="text-lg font-light text-[#0E1F34] mb-4">Baggage Fee Structure</h3>
          <div className="space-y-3">
            {BAG_FEES.map(({ bag, fee }) => (
              <div
                key={bag}
                className={`
                  flex items-center justify-between py-3 px-4 rounded-xl transition-all
                  ${bagCount >= bag
                    ? 'bg-[#C8102E]/10 border border-[#C8102E]/30'
                    : 'bg-white/20 border border-gray-200/30'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Luggage className={`w-5 h-5 ${bagCount >= bag ? 'text-[#C8102E]' : 'text-gray-400'}`} />
                  <span className="text-sm font-light text-[#0E1F34]">
                    Bag #{bag}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-light ${bagCount >= bag ? 'text-[#C8102E]' : 'text-gray-600'}`}>
                    ${fee}
                  </span>
                  {bagCount >= bag && (
                    <span className="px-2 py-1 bg-[#C8102E]/20 border border-[#C8102E]/30 rounded-full text-[#C8102E] text-xs font-light">
                      Added
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Baggage Policy */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-6">
          <h3 className="text-lg font-light text-[#0E1F34] mb-4">Baggage Policy</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#C8102E] mt-2 flex-shrink-0" />
              <p className="text-sm font-light text-gray-700">
                Maximum weight per bag: <strong>50 lbs (23 kg)</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#C8102E] mt-2 flex-shrink-0" />
              <p className="text-sm font-light text-gray-700">
                Maximum dimensions: <strong>62 linear inches (157 cm)</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#C8102E] mt-2 flex-shrink-0" />
              <p className="text-sm font-light text-gray-700">
                Additional bags beyond 3 require customer service approval
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#C8102E] mt-2 flex-shrink-0" />
              <p className="text-sm font-light text-gray-700">
                Overweight (51-70 lbs) or oversized bags incur additional fees
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-blue-50/40 border border-blue-200/60 shadow-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-light text-gray-700">
                You can add or remove checked bags up to 4 hours before departure. Fees are charged per bag, per flight.
              </p>
              {aiMode && (
                <p className="text-xs font-light text-blue-600 mt-2">
                  AI can help estimate your baggage needs based on trip duration and purpose.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
