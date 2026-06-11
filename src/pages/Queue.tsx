import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'

export default function Queue() {
  const navigate = useNavigate()
  const { maxQueueSize, reactionTime, popupClickTime, setQueueNumber, currentQueue, setCurrentQueue } = useGameStore()

  // 새로고침 복원: currentQueue가 저장돼 있으면 그걸 사용, 없으면 실력 기반 계산
  const reactionRatio = Math.min(reactionTime / 1000, 1)
  const popupRatio = Math.min(popupClickTime / 10000, 1)
  const combined = reactionRatio * 0.3 + popupRatio * 0.7
  const calcedQueue = Math.max(1, Math.floor(maxQueueSize * combined))
  const startQueue = currentQueue > 0 ? currentQueue : calcedQueue

  const [queue, setQueue] = useState(startQueue)
  const queueRef = useRef(startQueue)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 대기열 감소 로직
  useEffect(() => {
    const tick = () => {
      if (queueRef.current <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setCurrentQueue(0)
        setQueueNumber(0)
        navigate('/captcha')
        return
      }
      const decrease = Math.floor(
        Math.random() * Math.floor(maxQueueSize * 0.002) + 1
      )
      queueRef.current = Math.max(0, queueRef.current - decrease)
      setQueue(queueRef.current)
      setCurrentQueue(queueRef.current) // sessionStorage에 현재 위치 저장
    }

    const scheduleNext = () => {
      const delay = Math.random() * 1000 + 500
      intervalRef.current = setTimeout(() => {
        tick()
        scheduleNext()
      }, delay)
    }

    scheduleNext()

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [maxQueueSize, navigate, setQueueNumber, setCurrentQueue])

  // 새로고침 감지 → 패널티 저장 후 실제 새로고침 허용
  useEffect(() => {
    const handleBeforeUnload = () => {
      const penalty = Math.floor(maxQueueSize * 0.3)
      setCurrentQueue(Math.min(queueRef.current + penalty, maxQueueSize))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [maxQueueSize, setCurrentQueue])

  const progress = Math.max(0, 1 - queue / startQueue)
  const queueDisplay = queue.toLocaleString()

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-8">
      {/* 타이틀 */}
      <div className="text-center">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase mb-1">가상 대기열</p>
        <p className="text-[#6B7280] text-sm tracking-tight">잠시만 기다려 주세요. 앞의 고객님들의 예매가 진행 중입니다.</p>
      </div>

      {/* 대기 번호 */}
      <div className="bg-white border border-[#E5E1F8] border-t-4 border-t-[#7C3AED] rounded-2xl px-8 py-10 text-center w-full shadow-sm">
        <p className="text-[#6B7280] text-xs tracking-widest mb-4">내 앞 대기자 수</p>
        <p className="text-[#1C1B22] font-mono text-6xl font-bold tabular-nums">
          {queueDisplay}
        </p>
        <p className="text-[#6B7280] text-sm mt-2">명</p>
      </div>

      {/* 진행 바 */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex justify-between text-xs text-[#6B7280] tracking-tight">
          <span>대기 중</span>
          <span>{Math.round(progress * 100)}% 완료</span>
        </div>
        <div className="w-full h-2 bg-[#E5E1F8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      <button
        onClick={() => {
          if (intervalRef.current) clearTimeout(intervalRef.current)
          setCurrentQueue(0)
          setQueueNumber(queue)
          navigate('/captcha')
        }}
        className="w-full py-4 border-2 border-[#7C3AED] rounded-xl text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-colors font-bold tracking-widest text-sm"
      >
        좌석 선택으로 이동 →
      </button>

      <p className="text-[#EF4444] text-xs text-center font-bold tracking-tight">
        ⚠ F5를 누르면 대기자가 추가됩니다
      </p>
    </div>
  )
}
