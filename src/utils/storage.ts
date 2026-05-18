import type { Session } from '../types'

const KEY = 'podobalFighter_sessions'

export function getSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getTopSessions(n = 3): Session[] {
  return getSessions()
    .filter((s) => s.isSuccess)
    .sort((a, b) => a.totalTime - b.totalTime)
    .slice(0, n)
}

export function getPreviousSession(): Session | null {
  const all = getSessions()
  return all.length >= 2 ? all[1] : null
}
