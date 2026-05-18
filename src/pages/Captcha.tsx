import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/useGameStore'

const LIMIT_SEC = 5
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // 헷갈리는 I, O 제외

function generateCode(): string {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}

// 각 글자에 랜덤 기울기/위치 부여
function CharDisplay({ ch, idx }: { ch: string; idx: number }) {
  const rotate = (idx % 2 === 0 ? -1 : 1) * (Math.random() * 15 + 5)
  const ty = (Math.random() - 0.5) * 10
  return (
    <span
      className="inline-block text-3xl font-black text-white select-none"
      style={{ transform: `rotate(${rotate}deg) translateY(${ty}px)` }}
    >
      {ch}
    </span>
  )
}

export default function Captcha() {
  const navigate = useNavigate()
  const { setCaptchaTime, finalize } = useGameStore()

  const [code, setCode] = useState(generateCode)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(LIMIT_SEC)

  const startRef = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  // autoFocus
  useEffect(() => {
    inputRef.current?.focus()
  }, [code])

  // 5초 카운트다운
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          finalize(false)
          navigate('/result')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [code, finalize, navigate])

  const handleSubmit = () => {
    if (input.toUpperCase() === code) {
      const elapsed = Date.now() - startRef.current
      setCaptchaTime(elapsed)
      navigate('/seat')
    } else {
      setError('보안문자가 일치하지 않습니다.')
      setInput('')
      // 새 코드 + 타이머 리셋
      const next = generateCode()
      setCode(next)
      setTimeLeft(LIMIT_SEC)
      startRef.current = Date.now()
      setTimeout(() => setError(''), 1500)
    }
  }

  const timerRatio = timeLeft / LIMIT_SEC
  const timerColor = timerRatio > 0.5 ? 'bg-green-500' : timerRatio > 0.25 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-6">
      {/* 헤더 */}
      <div className="text-center">
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-1">안심예매 보안문자</p>
        <p className="text-zinc-400 text-sm">아래 문자를 정확히 입력하세요</p>
      </div>

      {/* 타이머 바 */}
      <div className="w-full flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-600">인증 시간</span>
          <span className={`font-bold font-mono ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`}>
            {timeLeft}초
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerRatio * 100}%` }}
          />
        </div>
      </div>

      {/* 보안문자 이미지 */}
      <div className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-6 py-5 flex items-center justify-center gap-3"
        style={{ filter: 'contrast(1.1)' }}
      >
        {code.split('').map((ch, i) => (
          <CharDisplay key={`${code}-${i}`} ch={ch} idx={i} />
        ))}
      </div>

      {/* 입력 필드 */}
      <div className="w-full flex flex-col gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          maxLength={6}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="6자리 입력"
          className="w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded px-4 py-3 text-white text-center text-xl font-mono tracking-[0.5em] placeholder-zinc-700 outline-none transition-colors"
        />
        {error && (
          <p className="text-red-400 text-xs text-center">{error}</p>
        )}
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={input.length !== 6}
        className={`w-full py-4 rounded font-bold tracking-widest text-sm transition-all ${
          input.length === 6
            ? 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
      >
        확인
      </button>
    </div>
  )
}
