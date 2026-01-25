import { useState } from 'react'
import { ScanFace, QrCode } from 'lucide-react'
import LoginModal from './LoginModal'

export default function LoginButtons() {
  const [modalOpen, setModalOpen] = useState(false)
  const [loginType, setLoginType] = useState<'face' | 'qr'>('face')

  const handleOpenModal = (type: 'face' | 'qr') => {
    setLoginType(type)
    setModalOpen(true)
  }

  return (
    <>
      {/* Login Buttons Container */}
      <div className="fixed inset-x-0 bottom-0 top-0 flex items-center justify-center pointer-events-none z-10">
        <div className="transform translate-y-32 pointer-events-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Face Login Button */}
            <button
              onClick={() => handleOpenModal('face')}
              className="group relative flex flex-col items-center gap-4 px-12 py-8 bg-white/20 hover:bg-white/35 backdrop-blur-3xl border-2 border-white/30 hover:border-[#0E1F34]/40 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0E1F34]/30"
            >
              <div className="relative">
                <ScanFace
                  size={64}
                  className="text-[#0E1F34] group-hover:text-[#C8102E] transition-colors duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-2xl font-semibold text-[#0E1F34] group-hover:tracking-wide transition-all duration-300">
                Face Login
              </span>
              <span className="text-sm text-gray-600 font-light">
                Scan your face to continue
              </span>
            </button>

            {/* QR Login Button */}
            <button
              onClick={() => handleOpenModal('qr')}
              className="group relative flex flex-col items-center gap-4 px-12 py-8 bg-white/20 hover:bg-white/35 backdrop-blur-3xl border-2 border-white/30 hover:border-[#C8102E]/40 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#C8102E]/30"
            >
              <div className="relative">
                <QrCode
                  size={64}
                  className="text-[#0E1F34] group-hover:text-[#C8102E] transition-colors duration-300 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-2xl font-semibold text-[#0E1F34] group-hover:tracking-wide transition-all duration-300">
                QR Login
              </span>
              <span className="text-sm text-gray-600 font-light">
                Scan your boarding pass
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={loginType}
      />
    </>
  )
}
