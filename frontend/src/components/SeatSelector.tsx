import { useState, useMemo } from 'react'
import { X } from 'lucide-react'

interface Seat {
  id: string
  row: number
  letter: string
  type: 'economy' | 'premium' | 'first'
  status: 'available' | 'occupied' | 'selected' | 'extra-legroom'
  price?: number
}

interface SeatSelectorProps {
  currentSeat?: string
  onSelect: (seatId: string) => void
  onClose: () => void
}

export function SeatSelector({ currentSeat, onSelect, onClose }: SeatSelectorProps) {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(currentSeat || null)

  // Generate seat map once using useMemo to prevent regeneration
  const seats = useMemo(() => {
    const seatList: Seat[] = []
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']

    // Pre-determined occupied seats for consistency
    const occupiedSeats = new Set([
      '3B', '3E', '5A', '5F', '7C', '7D', '9B', '10E', '11A', '11F',
      '15C', '15D', '17B', '17E', '18A', '19F', '20C', '20D', '22B',
      '23E', '24A', '24F', '25C', '26D', '27B', '28E', '29A', '30F'
    ])

    for (let row = 1; row <= 30; row++) {
      letters.forEach((letter) => {
        const seatId = `${row}${letter}`
        let type: Seat['type'] = 'economy'
        let status: Seat['status'] = 'available'
        let price: number | undefined

        // First class (rows 1-5)
        if (row <= 5) {
          type = 'first'
        }
        // Premium economy (rows 6-12)
        else if (row <= 12) {
          type = 'premium'
        }

        // Exit rows with extra legroom
        if (row === 13 || row === 14) {
          status = 'extra-legroom'
          price = 45
        }

        // Pre-determined occupied seats
        if (occupiedSeats.has(seatId) && seatId !== currentSeat) {
          status = 'occupied'
        }

        // Current seat
        if (seatId === currentSeat) {
          status = 'selected'
        }

        seatList.push({ id: seatId, row, letter, type, status, price })
      })
    }

    return seatList
  }, [currentSeat]) // Only regenerate if currentSeat changes

  const rows = useMemo(() =>
    Array.from(new Set(seats.map(s => s.row))).sort((a, b) => a - b),
    [seats]
  )

  const getSeatColor = (seat: Seat) => {
    if (seat.id === selectedSeat) {
      return 'bg-[#C8102E] text-white border-[#C8102E]'
    }
    if (seat.status === 'occupied') {
      return 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-400'
    }
    if (seat.status === 'extra-legroom') {
      return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
    }
    if (seat.type === 'first') {
      return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
    }
    if (seat.type === 'premium') {
      return 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
    }
    return 'bg-white/40 text-gray-700 border-gray-300 hover:bg-white/60'
  }

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return
    setSelectedSeat(seat.id)
  }

  const handleConfirm = () => {
    if (selectedSeat) {
      onSelect(selectedSeat)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/90 border border-white/40 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-light text-[#0E1F34]">Select Your Seat</h2>
            <p className="text-sm font-light text-gray-600 mt-1">
              {currentSeat ? `Current seat: ${currentSeat}` : 'Choose a new seat'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Legend */}
        <div className="bg-gray-50/50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs font-light">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-white/40 border-gray-300"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-gray-400 border-gray-400"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-blue-100 border-blue-300"></div>
              <span>Extra Legroom (+$45)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-amber-100 border-amber-300"></div>
              <span>Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-purple-100 border-purple-300"></div>
              <span>First Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 bg-[#C8102E] border-[#C8102E]"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>

        {/* Seat Map */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          <div className="space-y-2">
            {/* Column headers */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8"></div>
              {['A', 'B', 'C', '', 'D', 'E', 'F'].map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-8 flex items-center justify-center text-xs font-light text-gray-500"
                >
                  {letter}
                </div>
              ))}
            </div>

            {/* Rows */}
            {rows.map((row) => (
              <div key={row} className="flex items-center justify-center gap-2">
                {/* Row number */}
                <div className="w-8 text-xs font-light text-gray-500 text-right">{row}</div>

                {/* Seats */}
                {['A', 'B', 'C'].map((letter) => {
                  const seat = seats.find(s => s.row === row && s.letter === letter)!
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'occupied'}
                      className={`
                        w-10 h-10 rounded border-2 text-xs font-light transition-all
                        ${getSeatColor(seat)}
                      `}
                    >
                      {seat.letter}
                    </button>
                  )
                })}

                {/* Aisle */}
                <div className="w-10"></div>

                {/* Right side seats */}
                {['D', 'E', 'F'].map((letter) => {
                  const seat = seats.find(s => s.row === row && s.letter === letter)!
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'occupied'}
                      className={`
                        w-10 h-10 rounded border-2 text-xs font-light transition-all
                        ${getSeatColor(seat)}
                      `}
                    >
                      {seat.letter}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              {selectedSeat && (
                <>
                  <p className="text-sm font-light text-gray-600">Selected Seat</p>
                  <p className="text-xl font-light text-[#0E1F34]">{selectedSeat}</p>
                  {seats.find(s => s.id === selectedSeat)?.price && (
                    <p className="text-sm font-light text-blue-600 mt-1">
                      +${seats.find(s => s.id === selectedSeat)?.price} upgrade
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-white/40 border border-white/60 hover:bg-white/50 text-gray-700 font-light transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedSeat}
                className="px-6 py-3 rounded-full bg-[#C8102E] hover:bg-[#a00d26] text-white font-light transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Seat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
