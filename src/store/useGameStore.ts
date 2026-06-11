import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Difficulty, GameStore, Rank, ZoneKey, SeatStatus } from '../types'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  small: '소규모',
  medium: '중대규모',
  hell: '지옥문',
  custom: '커스텀',
}

function calcRank(reactionTime: number, popupClickTime: number, captchaTime: number): Rank {
  if (reactionTime < 300 && popupClickTime < 5000 && captchaTime < 3000) return 'S'
  if (reactionTime < 800 && popupClickTime < 10000 && captchaTime < 5000) return 'A'
  if (popupClickTime < 20000 && captchaTime < 10000) return 'B'
  return 'F'
}

const emptyZoneSeats: Record<ZoneKey, SeatStatus[]> = {
  vip: [],
  floor2: [],
  floor3: [],
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
  currentQueue: 0,
  rank: null as Rank | null,
  isSuccess: false,
  bookingStartTime: 0,
  selectedZone: null as ZoneKey | null,
  zoneEntryTime: 0,
  zoneSeatStates: { ...emptyZoneSeats },
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDifficulty: (difficulty, size) =>
        set({ difficulty, maxQueueSize: size }),

      setConcertName: (name) => set({ concertName: name }),

      setReactionTime: (ms) => set({ reactionTime: ms }),

      setPopupClickTime: (ms) => set({ popupClickTime: ms }),

      setCaptchaTime: (ms) => set({ captchaTime: ms }),

      setQueueNumber: (n) => set({ queueNumber: n }),

      setCurrentQueue: (n) => set({ currentQueue: n }),

      incrementAlreadyTaken: () =>
        set((s) => ({ alreadyTakenCount: s.alreadyTakenCount + 1 })),

      setBookingStartTime: (ts) => set({ bookingStartTime: ts }),

      setSelectedZone: (zone) => set({ selectedZone: zone }),

      setZoneEntryTime: (ts) => set({ zoneEntryTime: ts }),

      setZoneSeatState: (zone, seats) =>
        set((s) => ({
          zoneSeatStates: { ...s.zoneSeatStates, [zone]: seats },
        })),

      finalize: (success) => {
        const { reactionTime, popupClickTime, captchaTime, bookingStartTime, maxQueueSize, difficulty } = get()
        const totalTime = success && bookingStartTime > 0 ? Date.now() - bookingStartTime : 0
        const rank = success ? calcRank(reactionTime, popupClickTime, captchaTime) : 'F'

        set({ totalTime, rank, isSuccess: success })

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

      reset: () => set({ ...initialState, zoneSeatStates: { ...emptyZoneSeats } }),
    }),
    {
      name: 'podobalFighter_gameState',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
