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
        <div className="transform translate-y-24 pointer-events-auto">
          <div className="flex gap-4">
            {/* Face Login Button */}
            <button
              onClick={() => handleOpenModal('face')}
              className="group relative flex flex-col items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/25 backdrop-blur-xl border border-white/20 hover:border-blue-500/30 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <div className="relative">
                <ScanFace
                  size={32}
                  className="text-[#0E1F34] group-hover:text-blue-600 transition-colors duration-300 group-hover:scale-125 group-hover:rotate-12"
                />
              </div>
              <span className="text-base font-semibold text-[#0E1F34] group-hover:tracking-wide transition-all duration-300">
                Face Login
              </span>
            </button>

            {/* QR Login Button */}
            <button
              onClick={() => handleOpenModal('qr')}
              className="group relative flex flex-col items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/25 backdrop-blur-xl border border-white/20 hover:border-[#C8102E]/30 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#C8102E]/50"
            >
              <div className="relative">
                <QrCode
                  size={32}
                  className="text-[#0E1F34] group-hover:text-[#C8102E] transition-colors duration-300 group-hover:scale-125 group-hover:rotate-12"
                />
              </div>
              <span className="text-base font-semibold text-[#0E1F34] group-hover:tracking-wide transition-all duration-300">
                QR Login
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
