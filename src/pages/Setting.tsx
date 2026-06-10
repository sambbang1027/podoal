import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'
import type { Difficulty } from '../types'

const PRESETS: { label: string; sub: string; difficulty: Difficulty; size: number }[] = [
  { label: '소규모', sub: '2,000명', difficulty: 'small', size: 2000 },
  { label: '중대규모', sub: '30,000명', difficulty: 'medium', size: 30000 },
  { label: '지옥문 🔥', sub: '100,000명', difficulty: 'hell', size: 100000 },
]

export default function Setting() {
  const navigate = useNavigate()
  const { setDifficulty, setConcertName, reset } = useGameStore()

  const [concert, setConcert] = useState('')
  const [selected, setSelected] = useState<Difficulty>('medium')
  const [customSize, setCustomSize] = useState('')
  const [error, setError] = useState('')

  const handlePreset = (difficulty: Difficulty, size: number) => {
    setSelected(difficulty)
    setCustomSize('')
    setError('')
    setDifficulty(difficulty, size)
  }

  const handleCustomChange = (v: string) => {
    setCustomSize(v)
    setSelected('custom')
    setError('')
  }

  const handleStart = () => {
    reset()
    let size = PRESETS.find((p) => p.difficulty === selected)?.size ?? 0

    if (selected === 'custom') {
      const n = parseInt(customSize, 10)
      if (isNaN(n) || n < 1000 || n > 150000) {
        setError('1,000명 ~ 150,000명 사이로 입력해 주세요.')
        return
      }
      size = n
    }

    setConcertName(concert || '가상 콘서트')
    setDifficulty(selected, size)
    navigate('/ready')
  }

  return (
    <div className="w-full max-w-lg flex flex-col gap-8">
      {/* 타이틀 */}
      <div className="text-center">
        <p className="text-5xl mb-3">🍇</p>
        <h1 className="font-display text-5xl text-[#1C1B22] tracking-widest">PODOAL FIGHTER</h1>
        <p className="text-[#6B7280] text-sm mt-1 tracking-tight">티켓팅 피지컬 트레이너</p>
      </div>

      {/* 콘서트 이름 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#6B7280] tracking-widest uppercase">콘서트명 (선택)</label>
        <input
          type="text"
          value={concert}
          onChange={(e) => setConcert(e.target.value)}
          placeholder="예: NCT 127 WORLD TOUR 2026"
          className="bg-[#F0EEF9] border border-[#E5E1F8] rounded px-4 py-3 text-[#1C1B22] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#7C3AED] transition-colors"
        />
      </div>

      {/* 난이도 프리셋 */}
      <div className="flex flex-col gap-3">
        <label className="text-xs text-[#6B7280] tracking-widest uppercase">예상 경쟁률 설정</label>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.difficulty}
              onClick={() => handlePreset(p.difficulty, p.size)}
              className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 transition-all tracking-tight ${
                selected === p.difficulty
                  ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                  : 'border-[#E5E1F8] bg-white text-[#1C1B22] hover:border-[#7C3AED] hover:text-[#7C3AED]'
              }`}
            >
              <span className="font-bold text-sm">{p.label}</span>
              <span className="text-xs opacity-70">{p.sub}</span>
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected('custom')}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                selected === 'custom'
                  ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]'
                  : 'border-[#E5E1F8] text-[#6B7280] hover:border-[#7C3AED] hover:text-[#7C3AED]'
              }`}
            >
              직접 입력
            </button>
            <input
              type="number"
              value={customSize}
              onChange={(e) => handleCustomChange(e.target.value)}
              onFocus={() => setSelected('custom')}
              placeholder="1,000 ~ 150,000"
              min={1000}
              max={150000}
              className="flex-1 bg-[#F0EEF9] border border-[#E5E1F8] rounded px-3 py-1.5 text-[#1C1B22] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
            <span className="text-[#6B7280] text-sm">명</span>
          </div>
          {error && <p className="text-[#EF4444] text-xs">{error}</p>}
        </div>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={handleStart}
        className="w-full h-14 bg-[#7C3AED] hover:bg-[#5B21B6] active:bg-[#5B21B6] text-white font-bold rounded-xl tracking-widest text-sm transition-colors"
      >
        훈련 시작 →
      </button>

      <p className="text-center text-[#9CA3AF] text-xs">
        PC 전용 · 실제 멜론티켓 API 미사용
      </p>
    </div>
  )
}
