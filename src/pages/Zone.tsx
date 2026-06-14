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
  const vipRushTriggered = useRef(false)

  const startBots = useCallback((zone: ZoneKey, extraCount?: number, onSoldOut?: () => void) => {
    const cfg = ZONE_CONFIG[zone]
    const count = extraCount ?? cfg.botCount

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
      // displaySeats: 화면 갱신 / setZoneSeatState: 페이지 이동 후 복원을 위한 Zustand 동기화
      setDisplaySeats((prev) => ({ ...prev, [zone]: [...seatsRef.current[zone]] }))
      setZoneSeatState(zone, [...seatsRef.current[zone]])

      if (seatsRef.current[zone].filter((s) => s === 'available').length === 0) {
        onSoldOut?.()
        return
      }

      const delay = Math.random() * (cfg.botMaxMs - cfg.botMinMs) + cfg.botMinMs
      const t = setTimeout(tick, delay)
      timersRef.current.push(t)
    }

    for (let i = 0; i < count; i++) {
      // 첫 tick을 거의 즉시 실행: 유저가 페이지를 빠르게 이탈해도 Zustand에 최신 상태가 남도록
      // (일반 간격인 300~900ms로 지연하면 첫 tick 전에 이탈 시 빈 배열이 저장될 수 있음)
      const firstDelay = Math.floor(Math.random() * 80)
      const t = setTimeout(tick, firstDelay)
      timersRef.current.push(t)
    }
  }, [setZoneSeatState])

  // deps를 []로 고정한 이유:
  // - Zustand 액션(setZoneSeatState 등)은 항상 동일한 참조 → 변경되지 않음
  // - startBots는 useCallback([setZoneSeatState])로 안정화됨
  // - zoneEntryTime은 최초 진입 시 1회만 읽으면 되므로 재실행 불필요
  useEffect(() => {
    const now = Date.now()
    let entryTime = zoneEntryTime
    if (entryTime === 0) {
      setZoneEntryTime(now)
      entryTime = now
    }
    // elapsed: Zone에 처음 들어온 후 경과 시간 (재진입 시 이어서 계산)
    const elapsed = now - entryTime

    // VIP 매진 시 floor2에 추가 봇을 투입하는 콜백
    // vipRushTriggered ref로 중복 실행 방지 (VIP 봇 여러 개가 동시에 매진 감지할 수 있음)
    const handleVipSoldOut = () => {
      if (vipRushTriggered.current) return
      vipRushTriggered.current = true
      setOpenedZones((prev) => ({ ...prev, floor2: true }))
      startBots('floor2', 6)
    }

    ZONE_KEYS.forEach((zone) => {
      const remaining = ZONE_CONFIG[zone].startDelay - elapsed
      if (remaining <= 0) {
        // 재진입이거나 이미 startDelay를 지난 구역 → 즉시 시작
        startBots(zone, undefined, zone === 'vip' ? handleVipSoldOut : undefined)
      } else {
        // 아직 startDelay 남은 구역 → 남은 시간만큼 기다렸다가 시작
        const t = setTimeout(() => {
          setOpenedZones((prev) => ({ ...prev, [zone]: true }))
          startBots(zone, undefined, zone === 'vip' ? handleVipSoldOut : undefined)
        }, remaining)
        timersRef.current.push(t)
      }
    })

    return () => {
      // 언마운트 시 최신 좌석 상태를 Zustand에 최종 저장 후 타이머 정리
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

    setSelectedZone(zone)
    navigate('/seat')
  }

  const allSoldOut = ZONE_KEYS.every(
    (z) => displaySeats[z].filter((s) => s === 'available').length === 0
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
