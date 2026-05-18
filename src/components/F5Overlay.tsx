import { useEffect, useState } from 'react'

interface Props {
  active: boolean
}

export default function F5Overlay({ active }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
        setVisible(true)
        setTimeout(() => setVisible(false), 1800)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [active])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-mono">서버 재연결 중...</p>
      </div>
    </div>
  )
}
