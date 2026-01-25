import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pathfinding/')({
  component: PathfindingPage,
})

function PathfindingPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Pathfinding</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <input
                type="text"
                placeholder="Enter starting location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <input
                type="text"
                placeholder="Enter destination"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="pt-4">
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Find Path
              </button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Directions</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>No directions available yet.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
