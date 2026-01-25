import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import LoginButtons from '@/components/LoginButtons'
import { isAuthenticated } from '@/utils/auth'
import Assistant3D from '@/components/Assistant3D'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  // Redirect to kiosk if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: '/kiosk' })
    }
  }, [navigate])

  return (
    <div
      className="fixed inset-0"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(200, 16, 46, 0.15) 50%, rgba(14, 31, 52, 0.2) 100%)',
      }}
    >
      {/* 3D Assistant Globe in Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <Assistant3D mode="passive" />
      </div>

      {/* Header with AA Logo */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        <img
          src="/americanairlineslogo.png"
          alt="American Airlines"
          className="h-24 md:h-28 object-contain"
        />
        <span className="text-2xl md:text-3xl font-semibold text-[#0E1F34]">
          Aria
        </span>
      </div>

      {/* Welcome Message */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20 max-w-2xl px-4">
        <h1 className="text-4xl md:text-5xl font-light text-[#0E1F34] mb-3">
          Welcome to Your Journey
        </h1>
        <p className="text-lg md:text-xl text-gray-700 font-light">
          Your personal AI travel assistant
        </p>
      </div>

      {/* Login Buttons */}
      <LoginButtons />
    </div>
  )
}
