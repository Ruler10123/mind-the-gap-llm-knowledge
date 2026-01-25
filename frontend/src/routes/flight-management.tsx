import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plane, Plus } from 'lucide-react'
import { FlightForm } from '@/components/FlightManagement/FlightForm'
import { FlightList } from '@/components/FlightManagement/FlightList'
import { useFlights } from '@/hooks/useFlights'

export const Route = createFileRoute('/flight-management')({
  component: FlightManagementPage,
})

function FlightManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { data: flights, isLoading, error } = useFlights()

  const handleFormSuccess = () => {
    setShowCreateForm(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/20">
              <Plane className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Flight Management</h1>
              <p className="text-white/60 mt-1">Monitor and manage all flights</p>
            </div>
          </div>

          {/* New Flight Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Flight
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
            Failed to load flights: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <FlightForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Flight List */}
        <FlightList flights={flights || []} isLoading={isLoading} />
      </div>
    </div>
  )
}
