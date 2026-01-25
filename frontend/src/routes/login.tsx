import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import LoginButtons from '@/components/LoginButtons'
import { isAuthenticated } from '@/utils/auth'

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
    <div className="fixed inset-0 bg-gradient-to-br from-white to-[rgba(51,67,87,0.8)]">
      {/* Branding Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-[#0E1F34] mb-2">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
            Aria
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 font-normal">Please log in to continue</p>
      </div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Login Buttons */}
      <LoginButtons />
    </div>
  )
}
