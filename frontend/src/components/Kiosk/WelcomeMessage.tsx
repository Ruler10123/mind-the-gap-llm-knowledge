interface WelcomeMessageProps {
  userName: string
  isVisible: boolean
}

export function WelcomeMessage({ userName, isVisible }: WelcomeMessageProps) {
  if (!isVisible) return null

  return (
    <div className="text-center mb-8 animate-fade-in">
      <div className="flex items-end justify-center gap-3 mb-3">
        <img
          src="/CLOVER.svg"
          alt=""
          className="h-[2rem] md:h-[2.5rem] lg:h-[3rem] w-auto relative top-0.5 md:top-1 lg:top-[-0.0rem]"
          style={{ color: '#0E1F34' }}
        />
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#0E1F34] leading-none">
          Welcome, {userName}
        </h1>
      </div>
      <p className="text-lg md:text-xl text-gray-600 font-normal">
        How can I assist you with your flight today?
      </p>
    </div>
  )
}
