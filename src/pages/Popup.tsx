import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'

const DATES = [
  { id: 'd1', label: '6/14 토', active: false },
  { id: 'd2', label: '6/15 일', active: true },
  { id: 'd3', label: '6/21 토', active: true },
  { id: 'd4', label: '6/22 일', active: false },
]

const SESSIONS: Record<string, { id: string; label: string }[]> = {
  d2: [
    { id: 's1', label: '17:00' },
    { id: 's2', label: '20:00' },
  ],
  d3: [
    { id: 's3', label: '17:00' },
    { id: 's4', label: '20:00' },
  ],
}

export default function Popup() {
  const navigate = useNavigate()
  const { setPopupClickTime, concertName } = useGameStore()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const startRef = useRef<number>(Date.now())

  const handleDateClick = (id: string) => {
    setSelectedDate(id)
    setSelectedSession(null)
  }

  const handleSessionClick = (id: string) => {
    setSelectedSession(id)
  }

  const handleNext = () => {
    if (!selectedDate || !selectedSession) return
    const elapsed = Date.now() - startRef.current
    setPopupClickTime(elapsed)
    navigate('/queue')
  }

  const sessions = selectedDate ? (SESSIONS[selectedDate] ?? []) : []
  const canNext = selectedDate !== null && selectedSession !== null

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase mb-1">날짜 / 회차 선택</p>
        <p className="text-[#1C1B22] font-bold tracking-tight">{concertName || '가상 콘서트'}</p>
      </div>

      {/* 팝업 모달 */}
      <div className="bg-white border border-[#E5E1F8] rounded-2xl overflow-hidden shadow-sm">
        {/* 날짜 선택 */}
        <div className="border-b border-[#E5E1F8] p-4">
          <p className="text-[#6B7280] text-xs tracking-widest mb-3">날짜 선택</p>
          <div className="grid grid-cols-4 gap-2">
            {DATES.map((d) => (
              <button
                key={d.id}
                disabled={!d.active}
                onClick={() => handleDateClick(d.id)}
                className={`py-3 rounded-lg text-sm font-bold transition-all tracking-tight ${
                  !d.active
                    ? 'bg-[#F0EEF9] text-[#9CA3AF] cursor-not-allowed line-through border border-[#E5E1F8]'
                    : selectedDate === d.id
                    ? 'bg-[#7C3AED] text-white border border-[#7C3AED]'
                    : 'bg-[#F0EEF9] text-[#1C1B22] hover:border-[#7C3AED] hover:text-[#7C3AED] border border-[#E5E1F8]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 회차 선택 */}
        <div className="border-b border-[#E5E1F8] p-4 min-h-[88px]">
          <p className="text-[#6B7280] text-xs tracking-widest mb-3">회차 선택</p>
          {sessions.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm tracking-tight">날짜를 먼저 선택하세요</p>
          ) : (
            <div className="flex gap-3">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSessionClick(s.id)}
                  className={`px-6 py-3 rounded-lg text-sm font-bold transition-all border tracking-tight ${
                    selectedSession === s.id
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                      : 'bg-[#F0EEF9] text-[#1C1B22] hover:border-[#7C3AED] hover:text-[#7C3AED] border-[#E5E1F8]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 다음단계 버튼 */}
        <div className="p-4">
          <button
            onClick={handleNext}
            disabled={!canNext}
            className={`w-full py-4 rounded-xl font-bold tracking-widest text-sm transition-all ${
              canNext
                ? 'bg-[#7C3AED] hover:bg-[#5B21B6] active:scale-95 text-white'
                : 'bg-[#F0EEF9] text-[#9CA3AF] cursor-not-allowed'
            }`}
          >
            다음단계 →
          </button>
        </div>
      </div>

      {/* 콤보 가이드 */}
      <div className="flex items-center justify-center gap-3 text-xs text-[#9CA3AF] tracking-tight">
        <span className={selectedDate ? 'text-[#7C3AED] font-bold' : ''}>① 날짜</span>
        <span>→</span>
        <span className={selectedSession ? 'text-[#7C3AED] font-bold' : ''}>② 회차</span>
        <span>→</span>
        <span className={canNext ? 'text-[#7C3AED] font-bold' : ''}>③ 다음단계</span>
      </div>
    </div>
  )
}
