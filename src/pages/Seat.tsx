import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { ZONE_CONFIG } from '../utils/zoneConfig'
import type { SeatStatus } from '../types'

export default function Seat() {
  const navigate = useNavigate()
  const { selectedZone, zoneSeatStates, setZoneSeatState, incrementAlreadyTaken, finalize } = useGameStore()

  const zone = selectedZone ?? 'floor3'
  const cfg = ZONE_CONFIG[zone]

  // 스토어에서 좌석 상태 복원
  const seatsRef = useRef<SeatStatus[]>(
    zoneSeatStates[zone].length > 0 ? [...zoneSeatStates[zone]] : Array(cfg.total).fill('available')
  )
  const [seats, setSeats] = useState<SeatStatus[]>([...seatsRef.current])
  const [modal, setModal] = useState(false)
  const [soldOut, setSoldOut] = useState(
    () => seatsRef.current.filter((s) => s === 'available').length === 0
  )
  const botTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const runBot = useCallback(() => {
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
      setZoneSeatState(zone, [...seatsRef.current])

      if (seatsRef.current.filter((s) => s === 'available').length === 0) {
        setSoldOut(true)
        return
      }

      const delay = Math.random() * (cfg.botMaxMs - cfg.botMinMs) + cfg.botMinMs
      const t = setTimeout(tick, delay)
      botTimers.current.push(t)
    }

    const delay = Math.random() * (cfg.botMaxMs - cfg.botMinMs) + cfg.botMinMs
    const t = setTimeout(tick, delay)
    botTimers.current.push(t)
  }, [zone, cfg, setZoneSeatState])

  useEffect(() => {
    for (let i = 0; i < cfg.botCount; i++) {
      runBot()
    }
    return () => {
      botTimers.current.forEach(clearTimeout)
      botTimers.current = []
    }
  }, [cfg.botCount, runBot])

  // 매진 → 구역 선택으로 복귀
  useEffect(() => {
    if (soldOut) {
      const t = setTimeout(() => navigate('/zone'), 1800)
      return () => clearTimeout(t)
    }
  }, [soldOut, navigate])

  const handleSeatClick = (idx: number) => {
    if (modal || soldOut) return
    if (seatsRef.current[idx] !== 'available') return

    if (Math.random() < cfg.takenProb) {
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
    setZoneSeatState(zone, [...seatsRef.current])

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
  const rows = Math.ceil(cfg.total / cfg.cols)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 헤더 */}
      <div className="bg-white border border-[#E5E1F8] rounded-2xl px-6 py-4 text-center shadow-sm w-full max-w-lg">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase mb-1">
          {cfg.label} 좌석 선택
        </p>
        <p className="text-sm text-[#6B7280] tracking-tight">
          잔여 <span className="text-[#7C3AED] font-bold text-lg">{availableCount}</span> / {cfg.total}석
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
            <p className="text-[#EF4444] text-3xl font-bold mb-2 tracking-tight">
              {cfg.label} 매진 😭
            </p>
            <p className="text-white/60 text-sm tracking-tight">구역 선택으로 돌아갑니다...</p>
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

      {/* 좌석 그리드 */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}
      >
        {Array.from({ length: rows }).map((_, rowIdx) =>
          Array.from({ length: cfg.cols }).map((_, colIdx) => {
            const idx = rowIdx * cfg.cols + colIdx
            if (idx >= cfg.total) return null
            const status = seats[idx]
            return (
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
            )
          })
        )}
      </div>
    </div>
  )
}
