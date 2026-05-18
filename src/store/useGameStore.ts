import { create } from 'zustand'
import type { Difficulty, GameStore, Rank } from '../types'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  small: '소규모',
  medium: '중대규모',
  hell: '지옥문',
  custom: '커스텀',
}

function calcRank(reactionTime: number, popupClickTime: number, captchaTime: number): Rank {
  // reactionTime  : 버튼 활성 → 첫 클릭 (빠를수록 좋음, 기준 1초)
  // popupClickTime: 버튼 활성 → 날짜/시간 선택 완료 (기준 5~15초)
  // captchaTime   : 보안문자 입력 소요 시간 (기준 2~6초)
  if (reactionTime < 300 && popupClickTime < 5000 && captchaTime < 3000) return 'S'
  if (reactionTime < 800 && popupClickTime < 10000 && captchaTime < 5000) return 'A'
  if (popupClickTime < 20000 && captchaTime < 10000) return 'B'
  return 'F'
}

const initialState = {
  maxQueueSize: 30000,
  difficulty: 'medium' as Difficulty,
  concertName: '',
  reactionTime: 0,
  popupClickTime: 0,
  captchaTime: 0,
  totalTime: 0,
  alreadyTakenCount: 0,
  queueNumber: 0,
  rank: null as Rank | null,
  isSuccess: false,
  bookingStartTime: 0,
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setDifficulty: (difficulty, size) =>
    set({ difficulty, maxQueueSize: size }),

  setConcertName: (name) => set({ concertName: name }),

  setReactionTime: (ms) => set({ reactionTime: ms }),

  setPopupClickTime: (ms) => set({ popupClickTime: ms }),

  setCaptchaTime: (ms) => set({ captchaTime: ms }),

  setQueueNumber: (n) => set({ queueNumber: n }),

  incrementAlreadyTaken: () =>
    set((s) => ({ alreadyTakenCount: s.alreadyTakenCount + 1 })),

  setBookingStartTime: (ts) => set({ bookingStartTime: ts }),

  finalize: (success) => {
    const { reactionTime, popupClickTime, captchaTime, bookingStartTime, maxQueueSize, difficulty } = get()
    const totalTime = success ? Date.now() - bookingStartTime : 0
    const rank = success ? calcRank(reactionTime, popupClickTime, captchaTime) : 'F'

    set({ totalTime, rank, isSuccess: success })

    // LocalStorage 저장
    const session = {
      date: new Date().toLocaleString('ko-KR', { hour12: false }).slice(0, 16),
      difficulty: DIFFICULTY_LABELS[difficulty],
      maxQueueSize,
      reactionTime,
      popupClickTime,
      captchaTime,
      totalTime,
      rank,
      isSuccess: success,
    }

    try {
      const raw = localStorage.getItem('podobalFighter_sessions')
      const sessions = raw ? JSON.parse(raw) : []
      sessions.unshift(session)
      if (sessions.length > 50) sessions.pop()
      localStorage.setItem('podobalFighter_sessions', JSON.stringify(sessions))
    } catch {
      // localStorage 접근 실패 시 무시
    }
  },

  reset: () => set({ ...initialState }),
}))
