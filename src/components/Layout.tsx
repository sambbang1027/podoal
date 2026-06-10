import { Outlet, useLocation } from 'react-router-dom'
import F5Overlay from './F5Overlay'

const F5_ACTIVE_PATHS = ['/ready', '/popup', '/queue']

const STAGE_LABELS: Record<string, string> = {
  '/': 'SETTING',
  '/ready': 'READY',
  '/queue': 'QUEUE',
  '/captcha': 'CAPTCHA',
  '/seat': 'SEAT',
  '/result': 'RESULT',
}

const STAGE_ORDER = ['/', '/ready', '/queue', '/captcha', '/seat', '/result']

export default function Layout() {
  const { pathname } = useLocation()
  const f5Active = F5_ACTIVE_PATHS.includes(pathname)
  const currentIdx = STAGE_ORDER.indexOf(pathname)

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      <F5Overlay active={f5Active} />

      {/* 상단 진행 바 */}
      <header className="bg-white border-b border-[#E5E1F8] px-6 py-3 flex items-center justify-between">
        <span className="text-[#7C3AED] font-bold tracking-widest text-sm">🍇 PODOAL FIGHTER</span>
        <div className="flex items-center gap-1">
          {STAGE_ORDER.map((path, idx) => (
            <div
              key={path}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx <= currentIdx
                  ? 'w-6 bg-[#7C3AED]'
                  : 'w-6 bg-[#E5E1F8]'
              }`}
            />
          ))}
        </div>
        <span className="text-[#6B7280] text-xs tracking-widest">
          {STAGE_LABELS[pathname] ?? ''}
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
    </div>
  )
}
