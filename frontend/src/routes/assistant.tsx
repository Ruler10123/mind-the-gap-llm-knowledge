import { createFileRoute } from '@tanstack/react-router'
import Assistant3D from '@/components/Assistant3D'

export const Route = createFileRoute('/assistant')({
  component: AssistantPage,
})

function AssistantPage() {
  return (
    <div className="h-screen w-full bg-gray-900">
      <Assistant3D />
    </div>
  )
}
