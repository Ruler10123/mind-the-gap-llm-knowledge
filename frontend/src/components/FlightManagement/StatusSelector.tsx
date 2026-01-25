import { FlightStatus } from '@/types/flight'

interface StatusSelectorProps {
  value: FlightStatus
  onChange: (value: FlightStatus) => void
  disabled?: boolean
}

export function StatusSelector({ value, onChange, disabled }: StatusSelectorProps) {
  const allStatuses = Object.values(FlightStatus)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FlightStatus)}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {allStatuses.map((status) => (
        <option key={status} value={status} className="bg-slate-800 text-white">
          {status}
        </option>
      ))}
    </select>
  )
}
