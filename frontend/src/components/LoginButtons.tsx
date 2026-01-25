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
              className="group relative flex flex-col items-center gap-2 px-6 py-4 bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md border border-gray-700 hover:border-blue-500 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className="relative">
                <ScanFace
                  size={32}
                  className="text-blue-400 group-hover:text-blue-300 transition-colors"
                />
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                Face Login
              </span>
            </button>

            {/* QR Login Button */}
            <button
              onClick={() => handleOpenModal('qr')}
              className="group relative flex flex-col items-center gap-2 px-6 py-4 bg-gray-900/80 hover:bg-gray-800/90 backdrop-blur-md border border-gray-700 hover:border-purple-500 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="relative">
                <QrCode
                  size={32}
                  className="text-purple-400 group-hover:text-purple-300 transition-colors"
                />
                <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
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
