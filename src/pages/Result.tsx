import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import { getTopSessions, getPreviousSession } from '../utils/storage'
import type { Rank } from '../types'

const RANK_META: Record<Rank, { emoji: string; title: string; color: string }> = {
  S: { emoji: '🏆', title: '신의 손',      color: 'text-yellow-500' },
  A: { emoji: '⚡', title: '광클 장인',     color: 'text-[#7C3AED]' },
  B: { emoji: '🖐️', title: '평범한 손가락', color: 'text-[#7C3AED]' },
  F: { emoji: '🙏', title: '취소표나 노려라', color: 'text-[#6B7280]' },
}

const MEDAL = ['🥇', '🥈', '🥉']

function fmt(ms: number): string {
  if (ms <= 0) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}초`
}

function buildFeedback(
  reactionTime: number,
  popupClickTime: number,
  captchaTime: number,
  prev: ReturnType<typeof getPreviousSession>
): string {
  if (!prev) return '첫 훈련 기록이에요! 다음 판에서 점수를 비교해 드릴게요. 💪'

  const msgs: string[] = []

  const rDiff = prev.reactionTime - reactionTime
  if (rDiff > 50) msgs.push(`정각 클릭이 ${rDiff}ms 빨라졌어요!`)
  else if (rDiff < -50) msgs.push(`정각 클릭이 ${Math.abs(rDiff)}ms 느려졌습니다. 시계에 집중하세요.`)

  const pDiff = prev.popupClickTime - popupClickTime
  if (pDiff > 200) msgs.push(`팝업 콤보가 ${fmt(pDiff)} 단축됐어요!`)
  else if (pDiff < -200) msgs.push(`팝업 선택이 ${fmt(Math.abs(pDiff))} 느려졌습니다. 동선을 줄여보세요.`)

  const cDiff = prev.captchaTime - captchaTime
  if (cDiff > 300) msgs.push(`보안문자 입력이 ${fmt(cDiff)} 단축됐어요!`)
  else if (cDiff < -300) msgs.push(`보안문자 입력이 ${fmt(Math.abs(cDiff))} 느려졌습니다.`)

  if (msgs.length === 0) return '이전 판과 비슷한 기록이에요. 조금만 더 집중해봐요!'
  return msgs.join(' ')
}

export default function Result() {
  const navigate = useNavigate()
  const {
    rank, isSuccess,
    reactionTime, popupClickTime, captchaTime, totalTime,
    alreadyTakenCount, difficulty, maxQueueSize,
    reset,
  } = useGameStore()

  const top3 = getTopSessions(3)
  const prev = getPreviousSession()
  const feedback = buildFeedback(reactionTime, popupClickTime, captchaTime, prev)
  const meta = rank ? RANK_META[rank] : RANK_META['F']

  const handleRetry = () => {
    reset()
    navigate('/')
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      {/* 결과 헤더 */}
      <div className="text-center flex flex-col items-center gap-2">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase">
          {isSuccess ? '예매 완료' : '예매 실패'}
        </p>
        <p className="text-6xl">{meta.emoji}</p>
        <p className={`text-3xl font-black tracking-tight ${meta.color}`}>{meta.title}</p>
        {rank && (
          <span className={`text-xs border px-3 py-1 rounded-full font-bold tracking-widest ${meta.color} border-current opacity-70`}>
            RANK {rank}
          </span>
        )}
        <p className="text-[#6B7280] text-xs mt-1 tracking-tight">
          {difficulty === 'small' ? '소규모' : difficulty === 'medium' ? '중대규모' : difficulty === 'hell' ? '지옥문' : '커스텀'} ({maxQueueSize.toLocaleString()}명)
        </p>
      </div>

      {/* 스테이지별 기록 */}
      <div className="bg-white border border-[#E5E1F8] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-[#E5E1F8]">
          <p className="text-[#6B7280] text-xs tracking-widest uppercase">스테이지별 기록</p>
        </div>
        <div className="divide-y divide-[#E5E1F8]">
          <StatRow label="정각 클릭 오차"   value={fmt(reactionTime)}   good={reactionTime < 200} />
          <StatRow label="팝업 콤보 속도"   value={fmt(popupClickTime)} good={popupClickTime < 3000} />
          <StatRow label="보안문자 입력"    value={fmt(captchaTime)}    good={captchaTime < 3000} />
          <StatRow label="이선좌 당한 횟수" value={`${alreadyTakenCount}회`} good={alreadyTakenCount === 0} />
          <div className="px-4 py-3 flex justify-between items-center">
            <span className="text-[#6B7280] text-sm tracking-tight">총 소요 시간</span>
            <span className="text-[#1C1B22] font-bold font-mono">{fmt(totalTime)}</span>
          </div>
        </div>
      </div>

      {/* 피드백 */}
      <div className="bg-[#F0EEF9] border-l-4 border-[#7C3AED] rounded-lg px-4 py-4">
        <p className="text-[#6B7280] text-xs tracking-widest uppercase mb-2">AI 피드백</p>
        <p className="text-[#1C1B22] text-sm leading-relaxed tracking-tight">{feedback}</p>
      </div>

      {/* 역대 탑 3 */}
      {top3.length > 0 && (
        <div className="bg-white border border-[#E5E1F8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#E5E1F8]">
            <p className="text-[#6B7280] text-xs tracking-widest uppercase">내 역대 최고 기록</p>
          </div>
          <div className="divide-y divide-[#E5E1F8]">
            {top3.map((s, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{MEDAL[i]}</span>
                  <div>
                    <p className="text-[#1C1B22] font-mono text-sm font-bold">{fmt(s.totalTime)}</p>
                    <p className="text-[#9CA3AF] text-xs tracking-tight">{s.date} · {s.difficulty}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${RANK_META[s.rank].color}`}>
                  {RANK_META[s.rank].emoji} {s.rank}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다시 하기 */}
      <button
        onClick={handleRetry}
        className="w-full py-4 bg-[#7C3AED] hover:bg-[#5B21B6] active:scale-95 text-white font-bold rounded-xl tracking-widest text-sm transition-all"
      >
        다시 훈련하기 →
      </button>
    </div>
  )
}

function StatRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="px-4 py-3 flex justify-between items-center">
      <span className="text-[#6B7280] text-sm tracking-tight">{label}</span>
      <span className={`font-mono text-sm font-bold ${good ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
        {value}
      </span>
    </div>
  )
}
