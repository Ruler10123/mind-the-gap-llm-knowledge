import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  imageSrc: string
  altText: string
  notes?: string[]
}

export default function MapModal({
  isOpen,
  onClose,
  title,
  imageSrc,
  altText,
  notes,
}: MapModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} className="text-gray-700" />
        </button>

        {/* Image */}
        <div className="w-full aspect-video bg-gray-100">
          <img
            src={imageSrc}
            alt={altText}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          {notes && notes.length > 0 && (
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
