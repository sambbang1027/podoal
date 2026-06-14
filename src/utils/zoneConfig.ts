import type { ZoneKey, SeatStatus } from '../types'

export interface ZoneConfig {
  label: string
  total: number
  cols: number
  botCount: number
  botMinMs: number
  botMaxMs: number
  takenProb: number
  startDelay: number  // /zone 진입 후 봇 시작까지 지연 (ms)
}

export const ZONE_KEYS: ZoneKey[] = ['vip', 'floor2', 'floor3']

export const ZONE_CONFIG: Record<ZoneKey, ZoneConfig> = {
  vip: {
    label: 'VIP',
    total: 60,
    cols: 10,
    botCount: 10,
    botMinMs: 300,
    botMaxMs: 500,
    takenProb: 0.85,
    startDelay: 0,
  },
  floor2: {
    label: '2층',
    total: 120,
    cols: 15,
    botCount: 6,
    botMinMs: 600,
    botMaxMs: 800,
    takenProb: 0.3,
    startDelay: 500,
  },
  floor3: {
    label: '3층',
    total: 200,
    cols: 20,
    botCount: 5,
    botMinMs: 600,
    botMaxMs: 900,
    takenProb: 0.15,
    startDelay: 1500,
  },
}

export function initZoneSeats(total: number): SeatStatus[] {
  return Array(total).fill('available')
}
