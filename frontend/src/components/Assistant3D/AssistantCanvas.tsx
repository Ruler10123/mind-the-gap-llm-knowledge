import { useEffect, useRef, useState } from 'react'
import { useThreeScene } from './hooks/useThreeScene'
import { useAssistantAnimation } from './hooks/useAssistantAnimation'
import { LiquidGlassEntity } from './entities/LiquidGlassEntity'
import { PostProcessingManager } from './entities/PostProcessing'

interface AssistantCanvasProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer> | null
}

export default function AssistantCanvas({
  getFrequencyData,
}: AssistantCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [entity, setEntity] = useState<LiquidGlassEntity | null>(null)
  const [postProcessing, setPostProcessing] =
    useState<PostProcessingManager | null>(null)
  const [isReady, setIsReady] = useState(false)

  const { scene, camera, renderer } = useThreeScene(canvasRef)

  // Initialize entity and post-processing
  useEffect(() => {
    if (!scene || !camera || !renderer) return

    try {
      // Create entity
      const liquidGlass = new LiquidGlassEntity()
      scene.add(liquidGlass.mesh)
      setEntity(liquidGlass)

      // Create post-processing
      const postProc = new PostProcessingManager(renderer, scene, camera)
      setPostProcessing(postProc)

      // Handle resize for post-processing
      const handleResize = () => {
        postProc.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', handleResize)

      setIsReady(true)

      return () => {
        window.removeEventListener('resize', handleResize)
        liquidGlass.dispose()
        postProc.dispose()
        scene.remove(liquidGlass.mesh)
      }
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error)
    }
  }, [scene, camera, renderer])

  // Animation loop
  useAssistantAnimation(scene, camera, entity, postProcessing, getFrequencyData)

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-white text-lg">Loading 3D Assistant...</div>
        </div>
      )}
    </>
  )
}
