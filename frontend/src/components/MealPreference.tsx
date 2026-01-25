import { useState } from 'react'
import { toast } from '@/lib/toast'
import { UtensilsCrossed, Info, Check } from 'lucide-react'

interface MealOption {
  id: string
  name: string
  description: string
  dietary: string[]
  available: boolean
}

interface MealPreferenceProps {
  currentMeal?: string
  flightNumber?: string
  onMealChange?: (newMeal: string) => void
  onClose?: () => void
  aiMode?: boolean
}

const MEAL_OPTIONS: MealOption[] = [
  {
    id: 'chicken',
    name: 'Grilled Chicken',
    description: 'Herb-marinated grilled chicken with roasted vegetables',
    dietary: ['High Protein'],
    available: true,
  },
  {
    id: 'beef',
    name: 'Braised Beef',
    description: 'Tender braised beef with mashed potatoes',
    dietary: ['High Protein'],
    available: true,
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian Pasta',
    description: 'Penne pasta with marinara sauce and seasonal vegetables',
    dietary: ['Vegetarian'],
    available: true,
  },
  {
    id: 'vegan',
    name: 'Vegan Buddha Bowl',
    description: 'Quinoa, roasted chickpeas, and fresh greens',
    dietary: ['Vegan', 'Gluten-Free'],
    available: true,
  },
  {
    id: 'asian-veg',
    name: 'Asian Vegetable Stir-Fry',
    description: 'Mixed vegetables with rice and Asian-style sauce',
    dietary: ['Vegetarian', 'Dairy-Free'],
    available: true,
  },
  {
    id: 'gluten-free',
    name: 'Gluten-Free Salmon',
    description: 'Grilled salmon with steamed vegetables',
    dietary: ['Gluten-Free', 'High Protein'],
    available: true,
  },
  {
    id: 'no-meal',
    name: 'No Meal Preference',
    description: 'Skip the meal service',
    dietary: [],
    available: true,
  },
]

export function MealPreference({
  currentMeal = 'vegetarian',
  flightNumber = 'AA 2847',
  onMealChange,
  onClose,
  aiMode = false,
}: MealPreferenceProps) {
  const [selectedMeal, setSelectedMeal] = useState(currentMeal)

  const handleMealSelect = (mealId: string) => {
    const meal = MEAL_OPTIONS.find(m => m.id === mealId)
    if (!meal) return

    setSelectedMeal(mealId)
    toast.success(`Meal preference updated to ${meal.name}`, {
      description: 'Your selection has been saved',
    })
    onMealChange?.(mealId)
  }

  const currentMealData = MEAL_OPTIONS.find(m => m.id === selectedMeal)

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <UtensilsCrossed className="w-6 h-6 text-[#C8102E]" />
                <h2 className="text-2xl font-light text-[#0E1F34]">Meal Preference</h2>
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

        {/* Current Selection */}
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/30 border border-white/40 shadow-xl p-8">
          <p className="text-sm font-light text-gray-600 mb-3">Current Selection</p>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-3xl font-light text-[#0E1F34] mb-2">
                {currentMealData?.name}
              </h3>
              <p className="text-sm font-light text-gray-600 mb-3">
                {currentMealData?.description}
              </p>
              {currentMealData?.dietary && currentMealData.dietary.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {currentMealData.dietary.map((diet) => (
                    <span
                      key={diet}
                      className="px-3 py-1 bg-green-100/60 border border-green-200/60 rounded-full text-green-700 text-xs font-light"
                    >
                      {diet}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Meal Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-light text-[#0E1F34] px-2">Available Options</h3>
          {MEAL_OPTIONS.map((meal) => (
            <button
              key={meal.id}
              onClick={() => handleMealSelect(meal.id)}
              disabled={!meal.available}
              className={`
                w-full text-left transition-all duration-300
                ${selectedMeal === meal.id
                  ? 'ring-2 ring-[#C8102E] bg-white/40'
                  : 'hover:bg-white/30 bg-white/20'
                }
                ${!meal.available ? 'opacity-50 cursor-not-allowed' : ''}
                rounded-2xl backdrop-blur-3xl border border-white/40 shadow-xl p-6
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-light text-[#0E1F34]">{meal.name}</h4>
                    {selectedMeal === meal.id && (
                      <span className="px-3 py-1 bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-full text-[#C8102E] text-xs font-light">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-light text-gray-600 mb-3">
                    {meal.description}
                  </p>
                  {meal.dietary.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {meal.dietary.map((diet) => (
                        <span
                          key={diet}
                          className="px-2 py-0.5 bg-gray-100/60 border border-gray-200/60 rounded-full text-gray-600 text-xs font-light"
                        >
                          {diet}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {!meal.available && (
                  <span className="px-3 py-1 bg-gray-200/60 border border-gray-300/60 rounded-full text-gray-600 text-xs font-light">
                    Unavailable
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-3xl bg-blue-50/40 border border-blue-200/60 shadow-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-light text-gray-700">
                Meal preferences can be updated up to 24 hours before departure. Special dietary requirements are available upon request.
              </p>
              {aiMode && (
                <p className="text-xs font-light text-blue-600 mt-2">
                  AI can suggest meals based on your dietary restrictions and past preferences.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
