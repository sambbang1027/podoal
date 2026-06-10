import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'

type SeatStatus = 'available' | 'taken' | 'selected'

const TOTAL = 400

const BOT_CONFIG: Record<string, { count: number; minMs: number; maxMs: number }> = {
  small:  { count: 3,  minMs: 400, maxMs: 800  },
  medium: { count: 8,  minMs: 200, maxMs: 500  },
  hell:   { count: 20, minMs: 50,  maxMs: 200  },
  custom: { count: 8,  minMs: 200, maxMs: 500  },
}

const TAKEN_PROB: Record<string, number> = {
  small: 0.15, medium: 0.30, hell: 0.45, custom: 0.30,
}

function initSeats(): SeatStatus[] {
  return Array(TOTAL).fill('available')
}

export default function Seat() {
  const navigate = useNavigate()
  const { difficulty, incrementAlreadyTaken, finalize } = useGameStore()

  const [seats, setSeats] = useState<SeatStatus[]>(initSeats)
  const [modal, setModal] = useState(false)
  const [soldOut, setSoldOut] = useState(false)

  const seatsRef = useRef<SeatStatus[]>(initSeats())
  const botTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const runBot = useCallback((minMs: number, maxMs: number) => {
    const tick = () => {
      const available = seatsRef.current
        .map((s, i) => (s === 'available' ? i : -1))
        .filter((i) => i !== -1)

      if (available.length === 0) return

      const idx = available[Math.floor(Math.random() * available.length)]
      seatsRef.current = seatsRef.current.map((s, i) =>
        i === idx && s === 'available' ? 'taken' : s
      )
      setSeats([...seatsRef.current])

      const remaining = seatsRef.current.filter((s) => s === 'available').length
      if (remaining === 0) {
        setSoldOut(true)
        return
      }

      const delay = Math.random() * (maxMs - minMs) + minMs
      const t = setTimeout(tick, delay)
      botTimers.current.push(t)
    }

    const delay = Math.random() * (maxMs - minMs) + minMs
    const t = setTimeout(tick, delay)
    botTimers.current.push(t)
  }, [])

  useEffect(() => {
    const cfg = BOT_CONFIG[difficulty] ?? BOT_CONFIG.medium
    for (let i = 0; i < cfg.count; i++) {
      runBot(cfg.minMs, cfg.maxMs)
    }
    return () => {
      botTimers.current.forEach(clearTimeout)
      botTimers.current = []
    }
  }, [difficulty, runBot])

  useEffect(() => {
    if (soldOut) {
      const t = setTimeout(() => navigate('/result'), 1800)
      return () => clearTimeout(t)
    }
  }, [soldOut, navigate])

  const handleSeatClick = (idx: number) => {
    if (modal || soldOut) return
    if (seatsRef.current[idx] !== 'available') return

    const prob = TAKEN_PROB[difficulty] ?? 0.3

    if (Math.random() < prob) {
      incrementAlreadyTaken()
      setModal(true)
      return
    }

    seatsRef.current = seatsRef.current.map((s, i) => {
      if (i === idx) return 'selected'
      if (s === 'selected') return 'available'
      return s
    })
    setSeats([...seatsRef.current])

    botTimers.current.forEach(clearTimeout)
    botTimers.current = []
    finalize(true)
    setTimeout(() => navigate('/result'), 300)
  }

  const closeModal = () => setModal(false)

  useEffect(() => {
    if (!modal) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') closeModal()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [modal])

  const availableCount = seats.filter((s) => s === 'available').length

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 헤더 */}
      <div className="bg-white border border-[#E5E1F8] rounded-2xl px-6 py-4 text-center shadow-sm w-full max-w-lg">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase mb-1">좌석 선택</p>
        <p className="text-sm text-[#6B7280] tracking-tight">
          잔여 <span className="text-[#7C3AED] font-bold text-lg">{availableCount}</span> / {TOTAL}석
        </p>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-5 text-xs text-[#6B7280] tracking-tight">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#7C3AED] inline-block" /> 선택 가능
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#9CA3AF] inline-block" /> 선점됨
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#F59E0B] inline-block" /> 선택 중
        </span>
      </div>

      {/* 매진 오버레이 */}
      {soldOut && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#EF4444] text-3xl font-bold mb-2 tracking-tight">매진되었습니다 😭</p>
            <p className="text-white/60 text-sm tracking-tight">결과 화면으로 이동합니다...</p>
          </div>
        </div>
      )}

      {/* 이선좌 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white border border-[#E5E1F8] rounded-2xl px-8 py-6 text-center flex flex-col gap-4 min-w-[280px] shadow-lg">
            <p className="text-[#1C1B22] font-bold text-sm tracking-tight">이미 선택된 좌석입니다.</p>
            <p className="text-[#6B7280] text-xs tracking-tight">다른 좌석을 선택해 주세요.</p>
            <button
              onClick={closeModal}
              className="w-full py-2 bg-[#7C3AED] hover:bg-[#5B21B6] text-white rounded-lg text-sm font-bold transition-colors tracking-widest"
            >
              확인 (Enter)
            </button>
          </div>
        </div>
      )}

      {/* 좌석 그리드 20x20 */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}
      >
        {seats.map((status, idx) => (
          <button
            key={idx}
            onClick={() => handleSeatClick(idx)}
            disabled={status === 'taken'}
            className={`w-5 h-5 rounded-sm transition-all duration-100 ${
              status === 'available'
                ? 'bg-[#7C3AED] hover:bg-[#5B21B6] hover:scale-110 cursor-pointer'
                : status === 'selected'
                ? 'bg-[#F59E0B] scale-110'
                : 'bg-[#9CA3AF] cursor-not-allowed'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
