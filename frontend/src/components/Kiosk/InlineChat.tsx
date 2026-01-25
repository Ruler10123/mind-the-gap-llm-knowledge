import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mic, MapPin, Info, Clock, Navigation } from 'lucide-react'
import { StreamingText } from '../StreamingText'
import { FlightDetailsCard } from '../FlightDetailsCard'
import { WeatherWidget } from '../WeatherWidget'
import FlightDelayInfo from './FlightDelayInfo'
import FlightCancellationInfo from './FlightCancellationInfo'
import OverbookingInfo from './OverbookingInfo'
import { renderMarkdown } from '@/utils/markdown'

interface InlineChatProps {
  isVisible: boolean
  onClose: () => void
  connected: boolean
  status: string
  error: string | null
  isRecording: boolean
  micSupported: boolean
  toggleMic: () => void
  streamingText: string
  isStreaming: boolean
  isProcessing: boolean
  sendMessage: (text: string) => void
  input: string
  onInputChange: (value: string) => void
  messages: Array<{
    id: string;
    type: 'user' | 'assistant' | 'component';
    content?: string;
    componentType?: string;
    componentData?: Record<string, any>;
    timestamp?: Date;
  }>
}


function formatTime(date?: Date): string {
  if (!date) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function InlineChat({
  isVisible,
  connected,
  status,
  error,
  isRecording,
  micSupported,
  toggleMic,
  streamingText,
  isStreaming,
  isProcessing,
  sendMessage,
  input,
  onInputChange,
  messages,
}: InlineChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      scrollToBottom()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [messages, streamingText])

  const handleSend = () => {
    const text = input.trim()
    if (!text || !connected) return
    sendMessage(text)
  }

  const handleVoiceToggle = () => {
    if (!connected || !micSupported || isProcessing) return
    // When recording, stop and send (same as send button)
    if (isRecording) {
      toggleMic() // This will stop recording and send via handleMicComplete
    } else {
      // When not recording, start recording
      toggleMic()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isVisible) return null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 kiosk-chat-scrollbar">
        {messages.length === 0 && !streamingText && !isRecording ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {!isRecording && (
              <>
                <p className="text-gray-600 text-lg font-light mb-2">
                  {connected ? 'Voice-First Assistant' : 'Connecting...'}
                </p>
                <p className="text-gray-500 text-sm">
                  {!connected ? status : 'Tap the microphone or type to start'}
                </p>
              </>
            )}
            {error && (
              <p className="text-red-500 text-xs mt-2 max-w-md">{error}</p>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => {
              // Render component messages
              if (message.type === 'component') {
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="flex justify-start w-full"
                  >
                    {message.componentType === 'flight_details' && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl"
                      >
                        <FlightDetailsCard flightData={message.componentData} />
                      </motion.div>
                    )}
                    {message.componentType === 'weather' && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl space-y-4"
                      >
                        {message.componentData?.locations ? (
                          // Multiple locations (e.g., "both")
                          message.componentData.locations.map((loc: any, idx: number) => (
                            <WeatherWidget
                              key={idx}
                              location={loc.location}
                              temp={loc.temp}
                              condition={loc.condition}
                              high={loc.high}
                              low={loc.low}
                              humidity={loc.humidity}
                              windSpeed={loc.windSpeed}
                              visibility={loc.visibility}
                              uvIndex={loc.uvIndex}
                              icon={loc.icon}
                              description={loc.description}
                              advice={loc.advice}
                              isMinimized={false}
                            />
                          ))
                        ) : (
                          // Single location
                          <WeatherWidget
                            location={message.componentData?.location ?? 'Dallas'}
                            temp={message.componentData?.temp}
                            condition={message.componentData?.condition}
                            high={message.componentData?.high}
                            low={message.componentData?.low}
                            humidity={message.componentData?.humidity}
                            windSpeed={message.componentData?.windSpeed}
                            visibility={message.componentData?.visibility}
                            uvIndex={message.componentData?.uvIndex}
                            icon={message.componentData?.icon}
                            description={message.componentData?.description}
                            advice={message.componentData?.advice}
                            isMinimized={false}
                          />
                        )}
                      </motion.div>
                    )}
                    {message.componentType === 'map' && message.componentData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl mx-auto"
                      >
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0E1F34] flex items-center justify-center flex-shrink-0">
                                <Navigation className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{message.componentData.title}</h3>
                                <p className="text-sm text-gray-500">Navigation directions</p>
                              </div>
                            </div>
                          </div>

                          {/* Map Image */}
                          <div className="p-6 bg-gray-50">
                            <div className="relative rounded-lg overflow-hidden shadow-md border border-gray-200">
                              <img
                                src={message.componentData.imageSrc}
                                alt={message.componentData.altText}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Directions */}
                          {message.componentData.notes && message.componentData.notes.length > 0 && (
                            <div className="px-6 py-5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Step-by-step directions</h4>
                              <div className="space-y-3">
                                {message.componentData.notes.map((note: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0E1F34] text-white flex items-center justify-center text-xs font-medium mt-0.5">
                                      {i === 0 ? '📍' : i}
                                    </div>
                                    <div className="flex-1 text-sm text-gray-700 leading-relaxed pt-0.5">
                                      {renderMarkdown(note, {
                                        codeClassName: "px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono"
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {message.componentType === 'destination_info' && message.componentData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl mx-auto"
                      >
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#0E1F34] flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">{message.componentData.name}</h3>
                                <p className="text-sm text-gray-500">{message.componentData.description}</p>
                              </div>
                            </div>
                          </div>

                          {/* Location Info Grid */}
                          {(message.componentData.location || message.componentData.terminal || message.componentData.gate || message.componentData.estimatedWalkTime || message.componentData.hours) && (
                            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
                              <div className="grid grid-cols-2 gap-4">
                                {message.componentData.terminal && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-semibold text-[#0E1F34]">T</span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Terminal</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.terminal}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.location && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <MapPin className="w-4 h-4 text-[#0E1F34]" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.location}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.gate && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-semibold text-[#0E1F34]">G</span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Near Gate</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.gate}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.estimatedWalkTime && (
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <Clock className="w-4 h-4 text-[#0E1F34]" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Walk Time</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.estimatedWalkTime}</p>
                                    </div>
                                  </div>
                                )}
                                {message.componentData.hours && (
                                  <div className="flex items-start gap-3 col-span-2">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <Clock className="w-4 h-4 text-[#0E1F34]" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</p>
                                      <p className="text-sm font-medium text-gray-900 mt-0.5">{message.componentData.hours}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Amenities */}
                          {message.componentData.amenities && message.componentData.amenities.length > 0 && (
                            <div className="px-6 py-5 border-b border-gray-100">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Amenities & Services</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {message.componentData.amenities.map((amenity: string, i: number) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8102E] flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Directions */}
                          {message.componentData.directions && message.componentData.directions.length > 0 && (
                            <div className="px-6 py-5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">How to Get There</h4>
                              <div className="space-y-3">
                                {message.componentData.directions.map((direction: string, i: number) => (
                                  <div key={i} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0E1F34] text-white flex items-center justify-center text-xs font-medium mt-0.5">
                                      {i + 1}
                                    </div>
                                    <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-0.5">{direction}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {message.componentType === 'flight_delay' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl"
                      >
                        <FlightDelayInfo
                          {...message.componentData}
                          sendMessage={sendMessage}
                        />
                      </motion.div>
                    )}
                    {message.componentType === 'flight_cancellation' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl"
                      >
                        <FlightCancellationInfo
                          {...message.componentData}
                          sendMessage={sendMessage}
                        />
                      </motion.div>
                    )}
                    {message.componentType === 'overbooking_offer' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl"
                      >
                        <OverbookingInfo
                          offer={message.componentData}
                          sendMessage={sendMessage}
                        />
                      </motion.div>
                    )}
                    {message.componentType === 'seat_management' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl"
                      >
                        <h3 className="text-lg font-semibold text-[#0E1F34] mb-4">Seat Management</h3>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Current Seat:</span> {message.componentData.currentSeat}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Class:</span> {message.componentData.seatClass}
                          </p>
                          {message.componentData.features && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Features:</span> {message.componentData.features.join(', ')}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {message.componentType === 'meal_preference' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl"
                      >
                        <h3 className="text-lg font-semibold text-[#0E1F34] mb-4">Meal Preferences</h3>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Current Meal:</span> {message.componentData.currentMeal}
                          </p>
                          {message.componentData.mealService && (
                            <p className="text-xs text-gray-600">{message.componentData.mealService}</p>
                          )}
                          {message.componentData.availableMeals && (
                            <div className="space-y-2 mt-4">
                              <p className="text-sm font-medium text-gray-700">Available Options:</p>
                              {message.componentData.availableMeals.map((meal: any) => (
                                <div key={meal.id} className="p-3 rounded-lg bg-white/30 border border-white/40">
                                  <p className="font-medium text-sm text-[#0E1F34]">{meal.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">{meal.description}</p>
                                  {meal.dietary && (
                                    <p className="text-xs text-gray-500 mt-1">{meal.dietary.join(', ')}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {message.componentType === 'checked_bags' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl"
                      >
                        <h3 className="text-lg font-semibold text-[#0E1F34] mb-4">Checked Baggage</h3>
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Bags Checked:</span> {message.componentData.checkedBags} / {message.componentData.allowance}
                          </p>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Weight Limit:</span> {message.componentData.weight}
                          </p>
                          {message.componentData.bags && message.componentData.bags.map((bag: any) => (
                            <div key={bag.id} className="p-3 rounded-lg bg-white/30 border border-white/40">
                              <p className="text-sm font-medium text-[#0E1F34]">Tag: {bag.tagNumber}</p>
                              <p className="text-xs text-gray-600 mt-1">Weight: {bag.weight}</p>
                              <p className="text-xs text-gray-600">Status: {bag.status}</p>
                              <p className="text-xs text-gray-600">Destination: {bag.destination}</p>
                            </div>
                          ))}
                          <div className="text-xs text-gray-600 mt-3">
                            <p>Additional bag: {message.componentData.additionalBagFee}</p>
                            <p>Oversize fee: {message.componentData.oversizeFee}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {message.componentType === 'wifi' && message.componentData && (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                        className="w-full max-w-2xl backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl"
                      >
                        <h3 className="text-lg font-semibold text-[#0E1F34] mb-4">WiFi Connection</h3>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Network:</span> {message.componentData.network}
                          </p>
                          {message.componentData.plans && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Available Plans:</p>
                              {message.componentData.plans.map((plan: any) => (
                                <div key={plan.id} className="p-3 rounded-lg bg-white/30 border border-white/40">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium text-sm text-[#0E1F34]">{plan.name}</p>
                                      <p className="text-xs text-gray-600 mt-1">{plan.description}</p>
                                      <p className="text-xs text-gray-500 mt-1">Speed: {plan.speed}</p>
                                    </div>
                                    <p className="font-bold text-[#C8102E]">${plan.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {message.componentData.instructions && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">How to Connect:</p>
                              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                {message.componentData.instructions.map((instruction: string, i: number) => (
                                  <li key={i}>{instruction}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              }

              // Render text messages
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, x: message.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                    className={`
                      max-w-[85%] px-5 py-3 rounded-2xl
                      ${message.type === 'user'
                        ? 'bg-[#C8102E] text-white shadow-lg'
                        : 'bg-[#0E1F34]/50 text-white backdrop-blur-md border border-white/30 shadow-md'}
                    `}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.type === 'user' ? message.content : renderMarkdown(message.content || '')}
                    </div>
                  </motion.div>
                  {message.timestamp && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-xs text-gray-500 mt-1 px-2"
                    >
                      {formatTime(message.timestamp)}
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
            {/* Processing Indicator - shown when processing but no text yet */}
            {isProcessing && !streamingText && !isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="flex justify-start"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                  className="max-w-[85%] px-5 py-3 rounded-2xl bg-[#0E1F34]/50 text-white backdrop-blur-md border border-white/30 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                    <span className="text-sm text-white/80">Processing your request...</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {streamingText && !isRecording && isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 10, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="flex justify-start"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.05 }}
                  className="max-w-[85%] px-5 py-3 rounded-2xl bg-[#0E1F34]/50 text-white backdrop-blur-md border border-white/30 shadow-md"
                >
                  <StreamingText text={streamingText} isStreaming={isStreaming} />
                </motion.div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Voice-First with Text Fallback */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          {/* Voice Toggle / Send Button - Shows Send icon when recording */}
          <button
            onClick={handleVoiceToggle}
            disabled={!connected || !micSupported || isProcessing || (isStreaming && !isRecording)}
            className={`
              p-4 rounded-full transition-all duration-300
              ${isRecording
                ? 'bg-[#C8102E] shadow-lg shadow-[#C8102E]/50 scale-110 hover:bg-[#a00d26]'
                : 'bg-white/20 hover:bg-white/30'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={
              !micSupported
                ? 'Microphone not supported'
                : isProcessing
                  ? 'Processing request...'
                : isRecording
                  ? 'Stop recording and send'
                  : 'Start microphone input'
            }
          >
            {isRecording ? (
              <Send className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-gray-700" />
            )}
          </button>

          {/* Text Input - Subtle */}
          <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 px-5 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? "Or type here..." : "Connecting..."}
              disabled={!connected}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm disabled:opacity-50"
            />
            {input.trim() && connected && !isRecording && (
              <button
                onClick={handleSend}
                disabled={isProcessing}
                className="p-2 rounded-full bg-[#C8102E] hover:bg-[#a00d26] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[2.5rem]"
                title={isProcessing ? "Processing..." : "Send message"}
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
