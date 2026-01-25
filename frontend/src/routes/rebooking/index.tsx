import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rebooking/')({
  component: RebookingPage,
})

function RebookingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Rebooking</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Flight
              </label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="font-semibold text-gray-900">AA1234</p>
                <p className="text-sm text-gray-600">DFW → LAX</p>
                <p className="text-sm text-gray-600">January 24, 2026</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Flight Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Morning (6 AM - 12 PM)</option>
                <option>Afternoon (12 PM - 6 PM)</option>
                <option>Evening (6 PM - 12 AM)</option>
              </select>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Search Available Flights
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
