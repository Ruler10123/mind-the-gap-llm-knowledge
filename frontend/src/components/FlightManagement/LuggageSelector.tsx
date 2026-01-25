import { LuggageState } from '@/types/flight'

interface LuggageSelectorProps {
  value: LuggageState
  onChange: (value: LuggageState) => void
  disabled?: boolean
}

export function LuggageSelector({ value, onChange, disabled }: LuggageSelectorProps) {
  const allStates = Object.values(LuggageState)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LuggageState)}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {allStates.map((state) => (
        <option key={state} value={state} className="bg-slate-800 text-white">
          {state}
        </option>
      ))}
    </select>
  )
}
