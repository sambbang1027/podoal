import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { ZONE_CONFIG, ZONE_KEYS, initZoneSeats } from '../utils/zoneConfig'
import type { ZoneKey, SeatStatus } from '../types'

export default function Zone() {
  const navigate = useNavigate()
  const {
    zoneSeatStates, zoneEntryTime,
    setZoneSeatState, setSelectedZone, setZoneEntryTime, finalize,
  } = useGameStore()

  // 좌석 ref (봇 로직용)
  const seatsRef = useRef<Record<ZoneKey, SeatStatus[]>>({
    vip:    zoneSeatStates.vip.length    > 0 ? [...zoneSeatStates.vip]    : initZoneSeats(ZONE_CONFIG.vip.total),
    floor2: zoneSeatStates.floor2.length > 0 ? [...zoneSeatStates.floor2] : initZoneSeats(ZONE_CONFIG.floor2.total),
    floor3: zoneSeatStates.floor3.length > 0 ? [...zoneSeatStates.floor3] : initZoneSeats(ZONE_CONFIG.floor3.total),
  })

  // 화면 렌더용 상태
  const [displaySeats, setDisplaySeats] = useState<Record<ZoneKey, SeatStatus[]>>({
    vip:    [...seatsRef.current.vip],
    floor2: [...seatsRef.current.floor2],
    floor3: [...seatsRef.current.floor3],
  })

  // 구역 오픈 여부 (봇 시작 타이밍 기반)
  const [openedZones, setOpenedZones] = useState<Record<ZoneKey, boolean>>(() => {
    const elapsed = zoneEntryTime > 0 ? Date.now() - zoneEntryTime : 0
    return {
      vip: true,
      floor2: elapsed >= ZONE_CONFIG.floor2.startDelay,
      floor3: elapsed >= ZONE_CONFIG.floor3.startDelay,
    }
  })

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const startBots = useCallback((zone: ZoneKey) => {
    const cfg = ZONE_CONFIG[zone]

    const tick = () => {
      const current = seatsRef.current[zone]
      const available = current
        .map((s, i) => (s === 'available' ? i : -1))
        .filter((i) => i !== -1)

      if (available.length === 0) return

      const idx = available[Math.floor(Math.random() * available.length)]
      seatsRef.current[zone] = current.map((s, i) =>
        i === idx && s === 'available' ? 'taken' : s
      )
      setDisplaySeats((prev) => ({ ...prev, [zone]: [...seatsRef.current[zone]] }))

      if (seatsRef.current[zone].filter((s) => s === 'available').length === 0) return

      const delay = Math.random() * (cfg.botMaxMs - cfg.botMinMs) + cfg.botMinMs
      const t = setTimeout(tick, delay)
      timersRef.current.push(t)
    }

    for (let i = 0; i < cfg.botCount; i++) {
      const delay = Math.random() * (cfg.botMaxMs - cfg.botMinMs) + cfg.botMinMs
      const t = setTimeout(tick, delay)
      timersRef.current.push(t)
    }
  }, [])

  useEffect(() => {
    const now = Date.now()
    let entryTime = zoneEntryTime
    if (entryTime === 0) {
      setZoneEntryTime(now)
      entryTime = now
    }
    const elapsed = now - entryTime

    ZONE_KEYS.forEach((zone) => {
      const remaining = ZONE_CONFIG[zone].startDelay - elapsed
      if (remaining <= 0) {
        startBots(zone)
      } else {
        const t = setTimeout(() => {
          setOpenedZones((prev) => ({ ...prev, [zone]: true }))
          startBots(zone)
        }, remaining)
        timersRef.current.push(t)
      }
    })

    return () => {
      // 언마운트 시 현재 좌석 상태 스토어에 저장
      ZONE_KEYS.forEach((zone) => {
        setZoneSeatState(zone, [...seatsRef.current[zone]])
      })
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneSelect = (zone: ZoneKey) => {
    const available = seatsRef.current[zone].filter((s) => s === 'available').length
    if (available === 0) return

    ZONE_KEYS.forEach((z) => {
      setZoneSeatState(z, [...seatsRef.current[z]])
    })

    setSelectedZone(zone)
    navigate('/seat')
  }

  const allSoldOut = ZONE_KEYS.every(
    (z) => seatsRef.current[z].filter((s) => s === 'available').length === 0
  )

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-4">
      {/* 헤더 */}
      <div className="text-center mb-2">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase mb-1">구역 선택</p>
        <p className="text-[#1C1B22] text-sm tracking-tight">원하는 구역을 선택하세요</p>
      </div>

      {/* 무대 */}
      <div className="w-1/2 bg-[#1C1B22] rounded-xl py-3 text-center shadow-sm">
        <p className="text-white text-sm font-bold tracking-widest">🎤 무 대</p>
      </div>

      {/* 구역 카드 */}
      {ZONE_KEYS.map((zone) => (
        <ZoneCard
          key={zone}
          zone={zone}
          seats={displaySeats[zone]}
          isOpen={openedZones[zone]}
          onSelect={handleZoneSelect}
        />
      ))}

      {/* 전체 매진 */}
      {allSoldOut && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-center">
          <p className="text-[#EF4444] font-bold tracking-tight">전 구역 매진 😭</p>
          <button
            onClick={() => { finalize(false); navigate('/result') }}
            className="mt-3 px-6 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-bold tracking-widest"
          >
            결과 보기
          </button>
        </div>
      )}
    </div>
  )
}

const ZONE_COLORS: Record<ZoneKey, { border: string; text: string; bar: string }> = {
  vip:    { border: '#7C3AED', text: '#7C3AED', bar: '#7C3AED' },
  floor2: { border: '#A855F7', text: '#A855F7', bar: '#A855F7' },
  floor3: { border: '#6B7280', text: '#6B7280', bar: '#6B7280' },
}

function ZoneCard({
  zone, seats, isOpen, onSelect,
}: {
  zone: ZoneKey
  seats: SeatStatus[]
  isOpen: boolean
  onSelect: (zone: ZoneKey) => void
}) {
  const cfg = ZONE_CONFIG[zone]
  const available = seats.filter((s) => s === 'available').length
  const soldOut = available === 0
  const progress = available / cfg.total
  const colors = ZONE_COLORS[zone]

  const disabled = soldOut || !isOpen

  return (
    <button
      onClick={() => onSelect(zone)}
      disabled={disabled}
      className={`w-full bg-white rounded-2xl p-5 transition-all text-left border-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-[0.99]'
      }`}
      style={{ borderColor: disabled ? '#E5E1F8' : colors.border }}
    >
      <div className="flex justify-between items-center mb-3">
        <div>
          <p
            className="font-bold text-xl tracking-tight"
            style={{ color: disabled ? '#9CA3AF' : colors.text }}
          >
            {cfg.label}
          </p>
          <p className="text-[#9CA3AF] text-xs tracking-tight mt-0.5">총 {cfg.total}석</p>
        </div>
        <div className="text-right">
          {soldOut ? (
            <span className="text-xs bg-[#EF4444] text-white px-2.5 py-1 rounded-full font-bold">매진</span>
          ) : !isOpen ? (
            <span className="text-xs bg-[#E5E1F8] text-[#6B7280] px-2.5 py-1 rounded-full font-bold tracking-tight">대기 중</span>
          ) : (
            <>
              <p
                className="text-3xl font-mono font-bold tabular-nums"
                style={{ color: colors.text }}
              >
                {available}
              </p>
              <p className="text-[#9CA3AF] text-xs tracking-tight">석 남음</p>
            </>
          )}
        </div>
      </div>

      {/* 잔여석 바 */}
      <div className="w-full h-1.5 bg-[#E5E1F8] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: soldOut ? '#9CA3AF' : colors.bar,
          }}
        />
      </div>
    </button>
  )
}
