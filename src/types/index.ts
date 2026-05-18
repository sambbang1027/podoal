export type Difficulty = 'small' | 'medium' | 'hell' | 'custom'
export type Rank = 'S' | 'A' | 'B' | 'F'

export interface Session {
  date: string
  difficulty: string
  maxQueueSize: number
  reactionTime: number
  popupClickTime: number
  captchaTime: number
  totalTime: number
  rank: Rank
  isSuccess: boolean
}

export interface GameStore {
  // 세팅
  maxQueueSize: number
  difficulty: Difficulty
  concertName: string

  // 스테이지별 기록
  reactionTime: number
  popupClickTime: number
  captchaTime: number
  totalTime: number
  alreadyTakenCount: number
  queueNumber: number

  // 결과
  rank: Rank | null
  isSuccess: boolean

  // 예매 시작 타임스탬프
  bookingStartTime: number

  // 액션
  setDifficulty: (difficulty: Difficulty, size: number) => void
  setConcertName: (name: string) => void
  setReactionTime: (ms: number) => void
  setPopupClickTime: (ms: number) => void
  setCaptchaTime: (ms: number) => void
  setQueueNumber: (n: number) => void
  incrementAlreadyTaken: () => void
  setBookingStartTime: (ts: number) => void
  finalize: (success: boolean) => void
  reset: () => void
}
