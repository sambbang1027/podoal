export type Difficulty = 'small' | 'medium' | 'hell' | 'custom'
export type Rank = 'S' | 'A' | 'B' | 'F'
export type ZoneKey = 'vip' | 'floor2' | 'floor3'
export type SeatStatus = 'available' | 'taken' | 'selected'

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

  // 대기열 현재 위치 (새로고침 복원용)
  currentQueue: number

  // 구역 선택
  selectedZone: ZoneKey | null
  zoneEntryTime: number
  zoneSeatStates: Record<ZoneKey, SeatStatus[]>

  // 액션
  setDifficulty: (difficulty: Difficulty, size: number) => void
  setConcertName: (name: string) => void
  setReactionTime: (ms: number) => void
  setPopupClickTime: (ms: number) => void
  setCaptchaTime: (ms: number) => void
  setQueueNumber: (n: number) => void
  setCurrentQueue: (n: number) => void
  incrementAlreadyTaken: () => void
  setBookingStartTime: (ts: number) => void
  setSelectedZone: (zone: ZoneKey | null) => void
  setZoneEntryTime: (ts: number) => void
  setZoneSeatState: (zone: ZoneKey, seats: SeatStatus[]) => void
  finalize: (success: boolean) => void
  reset: () => void
}
