import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/flights')({
  component: FlightsPage,
})

function FlightsPage() {
  const flightInfo = {
    flightNumber: 'AA1234',
    origin: 'DFW',
    destination: 'LAX',
    departureTime: '10:30 AM',
    arrivalTime: '12:45 PM',
    gate: 'A12',
    seat: '12A',
    status: 'On Time',
    date: 'January 24, 2026',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Flight Information</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{flightInfo.flightNumber}</p>
                <p className="text-sm text-gray-500 mt-1">{flightInfo.date}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  flightInfo.status === 'On Time' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {flightInfo.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">From</p>
              <p className="text-xl font-semibold text-gray-900">{flightInfo.origin}</p>
              <p className="text-sm text-gray-600 mt-1">{flightInfo.departureTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">To</p>
              <p className="text-xl font-semibold text-gray-900">{flightInfo.destination}</p>
              <p className="text-sm text-gray-600 mt-1">{flightInfo.arrivalTime}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500 mb-1">Gate</p>
              <p className="text-lg font-semibold text-gray-900">{flightInfo.gate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Seat</p>
              <p className="text-lg font-semibold text-gray-900">{flightInfo.seat}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
