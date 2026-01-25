import { useEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, useInView } from 'framer-motion'

export type ComponentMeta = { label: string; icon: string }

interface ComponentMessageWithScrollRefProps {
  messageId: string
  meta: ComponentMeta
  scrollRootRef: RefObject<HTMLDivElement | null>
  sidePanelRef: RefObject<HTMLDivElement | null>
  side: 'left' | 'right'
  register: (id: string, ref: RefObject<HTMLDivElement | null>, meta: ComponentMeta) => void
  unregister: (id: string) => void
  setOutOfView: (id: string, inView: boolean, side?: 'left' | 'right') => void
  onScrollToChat?: () => void
  children: React.ReactNode
}

export function ComponentMessageWithScrollRef({
  messageId,
  meta,
  scrollRootRef,
  sidePanelRef,
  side,
  register,
  unregister,
  setOutOfView,
  onScrollToChat,
  children,
}: ComponentMessageWithScrollRefProps) {
  const ref = useRef<HTMLDivElement>(null)

  const isInView = useInView(ref, {
    root: scrollRootRef,
    margin: '-8% 0px -30% 0px',
    amount: 0,
  })

  useEffect(() => {
    register(messageId, ref, meta)
    return () => unregister(messageId)
  }, [messageId, meta, register, unregister])

  useEffect(() => {
    setOutOfView(messageId, isInView, isInView ? undefined : side)
  }, [messageId, isInView, side, setOutOfView])

  const portaled =
    !isInView &&
    sidePanelRef.current &&
    createPortal(
      <motion.div
        key={messageId}
        layout
        initial={{ opacity: 0, x: side === 'left' ? -24 : 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full rounded-xl overflow-hidden shadow-xl border border-gray-200/80 bg-white"
      >
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
        {onScrollToChat && (
          <button
            type="button"
            onClick={onScrollToChat}
            className="w-full py-2.5 px-4 text-sm font-medium text-[#0E1F34]/90 hover:text-[#0E1F34] hover:bg-gray-50 border-t border-gray-200 transition-colors"
          >
            View in chat
          </button>
        )}
      </motion.div>,
      sidePanelRef.current
    )

  if (isInView) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10, x: -20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="flex justify-start w-full"
      >
        {children}
      </motion.div>
    )
  }

  return (
    <>
      <div
        ref={ref}
        className="flex justify-start w-full"
        style={{ height: 0, overflow: 'hidden' }}
        aria-hidden
      />
      {portaled}
    </>
  )
}

const COMPONENT_META: Record<string, ComponentMeta> = {
  flight_details: { label: 'Flight', icon: 'plane' },
  weather: { label: 'Weather', icon: 'cloud' },
  map: { label: 'Map', icon: 'map' },
  destination_info: { label: 'Destination', icon: 'map-pin' },
  flight_delay: { label: 'Delay', icon: 'alert' },
  flight_cancellation: { label: 'Cancel', icon: 'x-circle' },
}

export function getComponentMeta(componentType: string): ComponentMeta {
  return COMPONENT_META[componentType] ?? { label: 'Info', icon: 'info' }
}
