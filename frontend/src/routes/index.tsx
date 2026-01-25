import { createFileRoute } from '@tanstack/react-router'
import Assistant3D from '@/components/Assistant3D'
import LoginButtons from '@/components/LoginButtons'
import UserNameDisplay from '@/components/UserNameDisplay'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="fixed inset-0 bg-black">
      <Assistant3D />
      <LoginButtons />
      <UserNameDisplay />
    </div>
  )
}
