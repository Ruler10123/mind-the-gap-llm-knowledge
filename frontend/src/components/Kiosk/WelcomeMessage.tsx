interface WelcomeMessageProps {
  userName: string
  isVisible: boolean
}

export function WelcomeMessage({ userName, isVisible }: WelcomeMessageProps) {
  if (!isVisible) return null

  return (
    <div className="text-center mb-8 animate-fade-in">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0E1F34] mb-3">
        Welcome, {userName}
      </h1>
      <p className="text-lg md:text-xl text-gray-700 font-medium">
        How can I assist you with your flight today?
      </p>
    </div>
  )
}
