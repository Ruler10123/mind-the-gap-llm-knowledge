import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'face' | 'qr'
}

export default function LoginModal({ isOpen, onClose, type }: LoginModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initCamera()
    } else {
      stopCamera()
      setError('')
      setSuccess(false)
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Failed to access camera. Please grant camera permissions.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const captureImage = (): Blob | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
    })
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      const imageBlob = await captureImage()
      if (!imageBlob) {
        throw new Error('Failed to capture image')
      }

      const formData = new FormData()
      formData.append('file', imageBlob, 'capture.jpg')

      const endpoint = type === 'face' ? '/api/auth/face' : '/api/auth/qr'
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.status === 'success') {
        setSuccess(true)
        console.log('Authentication successful:', data.user)
        // Store user data in localStorage or state management
        localStorage.setItem('user', JSON.stringify(data.user))

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('userAuthenticated'))

        // Close modal after short delay
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(data.message || 'Authentication failed')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please try again.',
      )
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">
              {type === 'face' ? 'Face Recognition Login' : 'QR Code Login'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {success && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-6xl mb-2">✓</div>
                    <p className="text-white font-semibold">
                      Login Successful!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <p className="text-gray-400 text-sm text-center mb-4">
              {type === 'face'
                ? 'Position your face in the frame and click the button to authenticate'
                : 'Show your QR code to the camera and click the button to authenticate'}
            </p>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading || success || !stream}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : success ? (
                'Success!'
              ) : (
                `Login with ${type === 'face' ? 'Face' : 'QR Code'}`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
