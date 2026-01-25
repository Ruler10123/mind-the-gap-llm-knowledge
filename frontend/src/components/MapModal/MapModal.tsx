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
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md"
          aria-label="Close modal"
        >
          <X size={20} className="text-gray-700" />
        </button>

        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0E1F34] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">Navigation directions</p>
              </div>
            </div>
          </div>

          {/* Map Image */}
          <div className="px-8 py-6 bg-gray-50">
            <div className="relative rounded-lg overflow-hidden shadow-md border border-gray-200">
              <img
                src={imageSrc}
                alt={altText}
                className="w-full"
              />
            </div>
          </div>

          {/* Directions */}
          {notes && notes.length > 0 && (
            <div className="px-8 py-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-5">Step-by-step directions</h3>
              <div className="space-y-4">
                {notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0E1F34] text-white flex items-center justify-center text-sm font-medium">
                      {i === 0 ? '📍' : i}
                    </div>
                    <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-1">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
