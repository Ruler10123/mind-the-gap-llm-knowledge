import { createFileRoute } from '@tanstack/react-router'
import Assistant3D from '@/components/Assistant3D'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="fixed inset-0 bg-black">
      <Assistant3D />
    </div>
  )
}
