import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'

type SeatStatus = 'available' | 'taken' | 'selected'

const TOTAL = 400 // 20x20

// 난이도별 봇 설정
const BOT_CONFIG: Record<string, { count: number; minMs: number; maxMs: number }> = {
  small:  { count: 3,  minMs: 400, maxMs: 800  },
  medium: { count: 8,  minMs: 200, maxMs: 500  },
  hell:   { count: 20, minMs: 50,  maxMs: 200  },
  custom: { count: 8,  minMs: 200, maxMs: 500  },
}

// 난이도별 이선좌 확률
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

  // 봇 1개 실행
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

      // 전멸 체크
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

  // 봇 시작
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

  // 매진 처리
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

    // 이선좌 발동
    if (Math.random() < prob) {
      incrementAlreadyTaken()
      setModal(true)
      return
    }

    // 선택 성공 → 이전 selected 해제 후 새로 선택
    seatsRef.current = seatsRef.current.map((s, i) => {
      if (i === idx) return 'selected'
      if (s === 'selected') return 'available'
      return s
    })
    setSeats([...seatsRef.current])

    // 봇 정지 후 결과로 이동
    botTimers.current.forEach(clearTimeout)
    botTimers.current = []
    finalize(true)
    setTimeout(() => navigate('/result'), 300)
  }

  const closeModal = () => setModal(false)

  // 모달 Enter 키 닫기
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
      <div className="text-center">
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">좌석 선택</p>
        <p className="text-sm text-zinc-400">
          잔여 <span className="text-purple-400 font-bold">{availableCount}</span> / {TOTAL}석
        </p>
      </div>

      {/* 매진 오버레이 */}
      {soldOut && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-3xl font-bold mb-2">매진되었습니다 😭</p>
            <p className="text-zinc-500 text-sm">결과 화면으로 이동합니다...</p>
          </div>
        </div>
      )}

      {/* 이선좌 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-600 rounded-lg px-8 py-6 text-center flex flex-col gap-4 min-w-[280px]">
            <p className="text-white font-bold text-sm">이미 선택된 좌석입니다.</p>
            <p className="text-zinc-400 text-xs">다른 좌석을 선택해 주세요.</p>
            <button
              onClick={closeModal}
              className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-bold transition-colors"
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
                ? 'bg-purple-500 hover:bg-purple-300 hover:scale-110 cursor-pointer'
                : status === 'selected'
                ? 'bg-yellow-400 scale-110'
                : 'bg-zinc-700 cursor-not-allowed'
            }`}
          />
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-5 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> 선택 가능
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-zinc-700 inline-block" /> 선점됨
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> 선택 중
        </span>
      </div>
    </div>
  )
}
