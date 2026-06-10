import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'

type CountdownOption = 10 | 20 | 30

const DATES = [
  { id: 'd1', label: '2026년 06월 06일 토요일', active: true },
  { id: 'd2', label: '2026년 06월 07일 일요일', active: true },
]
const SESSIONS: Record<string, { id: string; label: string }[]> = {
  d1: [{ id: 's1', label: '17:00' }, { id: 's2', label: '20:00' }],
  d2: [{ id: 's3', label: '17:00' }, { id: 's4', label: '20:00' }],
}

export default function Ready() {
  const navigate = useNavigate()
  const { setReactionTime, setPopupClickTime, setBookingStartTime, concertName, maxQueueSize, difficulty } = useGameStore()

  const [_countdownOption, setCountdownOption] = useState<CountdownOption | null>(null)
  const [phase, setPhase] = useState<'select' | 'countdown' | 'active' | 'missed'>('select')
  const [nowMs, setNowMs] = useState(Date.now())
  const [targetMs, setTargetMs] = useState<number | null>(null)
  const [earlyClick, setEarlyClick] = useState(false)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [noSelectionWarning, setNoSelectionWarning] = useState(false)
  const popupStartRef = useRef<number>(0)
  const firstClickRef = useRef<number>(0)
  const reactionRecorded = useRef(false)

  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activatedAt = useRef<number>(0)
  const missedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    clockRef.current = setInterval(() => setNowMs(Date.now()), 10)
    return () => { if (clockRef.current) clearInterval(clockRef.current) }
  }, [])

  const startCountdown = (sec: CountdownOption) => {
    setCountdownOption(sec)
    const target = Date.now() + sec * 1000
    setTargetMs(target)
    activatedAt.current = target
    setPhase('countdown')
  }

  useEffect(() => {
    if (phase !== 'countdown' || targetMs === null) return
    if (nowMs >= targetMs) {
      setPhase('active')
      popupStartRef.current = Date.now()
      missedTimer.current = setTimeout(() => setPhase('missed'), 10000)
    }
  }, [nowMs, targetMs, phase])

  useEffect(() => {
    return () => { if (missedTimer.current) clearTimeout(missedTimer.current) }
  }, [])

  const handleDateClick = (id: string) => {
    if (phase !== 'active') return
    setSelectedDate(id)
    setSelectedSession(null)
  }

  const handleSessionClick = (id: string) => {
    if (phase !== 'active') return
    setSelectedSession(id)
  }

  const handleBookingClick = () => {
    if (phase === 'countdown') {
      setEarlyClick(true)
      setTimeout(() => setEarlyClick(false), 800)
      return
    }
    if (phase !== 'active') return

    if (!reactionRecorded.current) {
      firstClickRef.current = Date.now() - activatedAt.current
      reactionRecorded.current = true
    }

    if (!selectedDate || !selectedSession) {
      setNoSelectionWarning(true)
      setTimeout(() => setNoSelectionWarning(false), 1200)
      return
    }

    if (missedTimer.current) clearTimeout(missedTimer.current)

    const popupMs = Date.now() - popupStartRef.current
    setReactionTime(firstClickRef.current)
    setPopupClickTime(popupMs)
    setBookingStartTime(activatedAt.current)
    navigate('/queue')
  }

  const retry = () => {
    setPhase('select')
    setCountdownOption(null)
    setTargetMs(null)
    setSelectedDate(null)
    setSelectedSession(null)
    reactionRecorded.current = false
    firstClickRef.current = 0
  }

  const clockStr = (() => {
    const d = new Date(nowMs)
    return (
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0') + '.' +
      String(d.getMilliseconds()).padStart(3, '0')
    )
  })()

  const remainSec = targetMs !== null ? Math.max(0, targetMs - nowMs) / 1000 : null

  const difficultyLabel =
    difficulty === 'small' ? '소규모' :
    difficulty === 'medium' ? '중대규모' :
    difficulty === 'hell' ? '지옥문' : '커스텀'

  const sessions = selectedDate ? (SESSIONS[selectedDate] ?? []) : []
  const canBook = phase === 'active' && selectedDate !== null && selectedSession !== null

  return (
    <div className="w-full min-h-full text-[#1C1B22]">
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-0">

        {/* ── 콘서트 정보 카드 ── */}
        <div className="bg-white border border-[#E5E1F8] rounded-2xl p-6 flex gap-6 mb-4 shadow-sm">
          {/* 썸네일 */}
          <div className="w-36 h-36 flex-shrink-0 rounded-xl bg-[#F0EEF9] flex items-center justify-center text-5xl">
            🍇
          </div>

          {/* 정보 */}
          <div className="flex-1 flex flex-col gap-2.5">
            <div className="flex gap-1.5">
              <Badge color="#ff5c35">단독판매</Badge>
              <Badge color="#10B981">안심예매</Badge>
            </div>
            <h1 className="text-lg font-bold leading-snug text-[#1C1B22] tracking-tight">{concertName || '가상 콘서트'}</h1>
            <div className="grid grid-cols-2 gap-x-10 gap-y-1 mt-1">
              <InfoRow label="공연기간" value="2026.06.06 - 2026.06.07" />
              <InfoRow label="공연장" value="잠실실내체육관" />
              <InfoRow label="관람시간" value="약 120분" />
              <InfoRow label="관람등급" value="7세 이상" />
              <InfoRow label="장르" value="콘서트" />
              <InfoRow label="난이도" value={`${difficultyLabel} (${maxQueueSize.toLocaleString()}명)`} />
            </div>
          </div>
        </div>

        {/* ── 서버 시계 ── */}
        <div className="py-4 border-t border-[#E5E1F8] flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">서버 시간</span>
          <span className="font-mono text-4xl font-bold tabular-nums text-[#7C3AED]">{clockStr}</span>
        </div>

        {/* ── 날짜 / 시간 선택 패널 ── */}
        {phase === 'active' && (
          <div className="border-t border-[#E5E1F8] mt-2">
            <div className="flex" style={{ minHeight: '160px' }}>
              {/* 날짜 선택 */}
              <div className="flex-1 border-r border-[#E5E1F8] py-4 pr-4">
                <p className="text-xs font-bold text-[#6B7280] mb-3 flex items-center gap-1">
                  <span className="text-base">📅</span> 날짜 선택
                </p>
                <div className="flex flex-col gap-1">
                  {DATES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleDateClick(d.id)}
                      className="text-left px-3 py-2.5 rounded text-sm transition-colors tracking-tight"
                      style={{
                        backgroundColor: selectedDate === d.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                        color: selectedDate === d.id ? '#7C3AED' : '#1C1B22',
                        fontWeight: selectedDate === d.id ? '700' : '400',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 시간 선택 */}
              <div className="flex-1 py-4 pl-6">
                <p className="text-xs font-bold text-[#6B7280] mb-3 flex items-center gap-1">
                  <span className="text-base">🕐</span> 시간 선택
                </p>
                {sessions.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF] tracking-tight">날짜를 선택해주세요!</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSessionClick(s.id)}
                        className="text-left px-3 py-2.5 rounded text-sm transition-colors tracking-tight"
                        style={{
                          backgroundColor: selectedSession === s.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                          color: selectedSession === s.id ? '#7C3AED' : '#1C1B22',
                          fontWeight: selectedSession === s.id ? '700' : '400',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── missed ── */}
        {phase === 'missed' && (
          <div className="py-6 flex flex-col items-center gap-4 border-t border-[#E5E1F8]">
            <p className="text-lg font-bold text-[#EF4444] tracking-tight">타이밍을 놓쳤습니다 😭</p>
            <button
              onClick={retry}
              className="px-6 py-2 rounded-lg border-2 border-[#7C3AED] text-sm text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors tracking-tight"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* ── 예매하기 버튼 영역 ── */}
        {phase !== 'missed' && (
          <div className="pt-5 border-t border-[#E5E1F8] flex flex-col items-end gap-1">
            {earlyClick && (
              <p className="text-xs text-[#EF4444] font-bold w-full text-center mb-1 tracking-tight">
                ⚠️ 아직 예매 시간이 되지 않았습니다
              </p>
            )}
            {noSelectionWarning && (
              <p className="text-xs text-[#F59E0B] font-bold w-full text-center mb-1 tracking-tight">
                ⚠️ 날짜와 시간을 선택해주세요
              </p>
            )}

            {/* select 단계 — 카운트다운 시작 버튼 */}
            {phase === 'select' && (
              <div className="w-full flex flex-col items-end gap-3">
                <p className="text-xs text-[#6B7280] tracking-tight">예매 오픈 몇 초 전부터 시작할까요?</p>
                <div className="flex gap-2">
                  {([10, 20, 30] as CountdownOption[]).map((sec) => (
                    <button
                      key={sec}
                      onClick={() => startCountdown(sec)}
                      className="px-5 py-2 rounded-lg border-2 text-sm font-bold transition-colors hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] tracking-tight"
                      style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                    >
                      {sec}초 전
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* countdown / active — 예매하기 버튼 */}
            {(phase === 'countdown' || phase === 'active') && (
              <button
                onClick={handleBookingClick}
                disabled={phase === 'countdown' || !canBook}
                className="relative px-20 py-4 rounded-xl font-bold text-white text-base transition-all duration-300 tracking-widest"
                style={{
                  backgroundColor: canBook ? '#7C3AED' : '#E5E1F8',
                  color: canBook ? '#ffffff' : '#9CA3AF',
                  cursor: canBook ? 'pointer' : 'not-allowed',
                  minWidth: '180px',
                  boxShadow: canBook ? '0 2px 12px rgba(124,58,237,0.35)' : 'none',
                }}
              >
                {phase === 'countdown' && remainSec !== null ? (
                  <span className="font-mono tracking-widest text-lg text-[#7C3AED]">{remainSec.toFixed(3)}</span>
                ) : (
                  <span>예매하기</span>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-sm text-white tracking-tight"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-xs text-[#6B7280] w-16 flex-shrink-0 tracking-tight">{label}</span>
      <span className="text-xs text-[#1C1B22] tracking-tight">{value}</span>
    </div>
  )
}
