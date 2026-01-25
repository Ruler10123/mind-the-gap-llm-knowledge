import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
import { X, Download, CheckCircle, Camera, RotateCcw } from 'lucide-react'

export const Route = createFileRoute('/registration')({
  component: RegistrationPage,
})

interface FormData {
  name: string
  passenger_id: string
  flight_number: string
  seat: string
  group: string
}

function RegistrationPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    passenger_id: '',
    flight_number: '',
    seat: '',
    group: '',
  })

  const [capturedImage, setCapturedImage] = useState<Blob | null>(null)
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    initCamera()
    return () => {
      stopCamera()
      // Cleanup blob URLs
      if (capturedImageUrl) URL.revokeObjectURL(capturedImageUrl)
      if (qrCodeUrl) URL.revokeObjectURL(qrCodeUrl)
    }
  }, [])

  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedImage(blob)
        const url = URL.createObjectURL(blob)
        setCapturedImageUrl(url)
        stopCamera()
      }
    }, 'image/jpeg')
  }

  const retakePhoto = () => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl)
    }
    setCapturedImage(null)
    setCapturedImageUrl(null)
    setError(null)
    initCamera()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all fields
    if (
      !formData.name ||
      !formData.passenger_id ||
      !formData.flight_number ||
      !formData.seat ||
      !formData.group
    ) {
      setError('Please fill in all fields')
      return
    }

    if (!capturedImage) {
      setError('Please capture your photo before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = new FormData()
      submitData.append('file', capturedImage, 'photo.jpg')
      submitData.append('name', formData.name)
      submitData.append('passenger_id', formData.passenger_id)
      submitData.append('flight_number', formData.flight_number)
      submitData.append('seat', formData.seat)
      submitData.append('group', formData.group)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: submitData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Registration failed'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Backend returns QR code as PNG file
      const qrBlob = await response.blob()
      const qrUrl = URL.createObjectURL(qrBlob)
      setQrCodeUrl(qrUrl)
      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.',
      )
      console.error('Registration error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const a = document.createElement('a')
    a.href = qrCodeUrl
    a.download = `${formData.passenger_id}_qr.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (success && qrCodeUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-300">
              Your QR code has been generated. Save it for future logins.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg mb-6 inline-block">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-64 h-64 object-contain"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={downloadQRCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>

            <a
              href="/login"
              className="block w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Passenger Registration
          </h2>
          <a
            href="/login"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </a>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Form Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Passenger ID
                </label>
                <input
                  type="text"
                  name="passenger_id"
                  value={formData.passenger_id}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="ABC123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Flight Number
                </label>
                <input
                  type="text"
                  name="flight_number"
                  value={formData.flight_number}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="AA1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seat Number
                </label>
                <input
                  type="text"
                  name="seat"
                  value={formData.seat}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="12A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Boarding Group
                </label>
                <input
                  type="text"
                  name="group"
                  value={formData.group}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="A"
                  required
                />
              </div>
            </div>

            {/* Right Column: Camera/Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo
              </label>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
                {capturedImageUrl ? (
                  <img
                    src={capturedImageUrl}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                <canvas ref={canvasRef} className="hidden" />

                {/* Camera Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  {capturedImageUrl ? (
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="bg-gray-700/90 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Photo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-blue-600/90 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Capture Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <a
              href="/login"
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
