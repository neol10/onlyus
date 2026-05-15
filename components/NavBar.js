import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth, logout } from '../src/context/AuthContext'

function NavIcon({ active, path, children, label }) {
  return (
    <Link 
      href={path} 
      className={`relative flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2 px-4 py-2.5 sm:py-2 transition-all duration-300 ease-out ${
        active 
          ? 'text-slate-900 sm:theme-pill sm:shadow-md' 
          : 'text-slate-500 hover:text-slate-700 sm:text-slate-500 sm:hover:theme-pill'
      } active:scale-95`}
    >
      {/* Indicador Mobile de ativo */}
      {active && (
        <span className="absolute -top-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-b-full opacity-80 sm:hidden" style={{ background: 'linear-gradient(to right, transparent, var(--ou-accent, #4f46e5), transparent)' }} />
      )}
      <div className={`transition-transform duration-300 ${active ? 'scale-110 sm:scale-100' : ''}`}>
        {children}
      </div>
      <span className={`text-[10px] sm:text-sm font-semibold tracking-wide ${active ? 'sm:opacity-100' : 'sm:opacity-80'}`}>{label}</span>
    </Link>
  )
}

export default function NavBar() {
  const { user } = useAuth()
  const router = useRouter()
  const currentPath = router.pathname

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (err) {
      console.error('Logout error', err)
      alert('Erro ao sair')
    }
  }

  return (
    <>
      <header className="topbar-shell hidden sm:block">
        <div className="page-shell flex items-center justify-between gap-4 py-3 sm:py-4">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-[var(--ou-accent,#4f46e5)]">OnlyUs</span>
          </Link>
          
          {/* Navegação Desktop */}
          <nav className="flex items-center gap-2 lg:gap-4">
            <NavIcon active={currentPath === '/'} path="/" label="Feed">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </NavIcon>
            <NavIcon active={currentPath === '/timeline'} path="/timeline" label="Timeline">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </NavIcon>
            <NavIcon active={currentPath === '/settings'} path="/settings" label="Ajustes">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </NavIcon>
          </nav>

          {/* Área do Usuário */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={handleLogout} className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-rose-600 hover:bg-rose-500/10 active:scale-95">
                  Sair
                </button>
              </div>
            ) : (
              <Link href="/login" className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95" style={{ background: 'linear-gradient(135deg, var(--ou-theme-accent, #0f172a), var(--ou-accent, #4f46e5))' }}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Header Mobile Simplificado */}
      <header className="topbar-shell sm:hidden">
        <div className="page-shell flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-slate-900">OnlyUs</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={handleLogout} className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-rose-600 hover:bg-rose-500/10 active:scale-95">
                Sair
              </button>
            ) : (
              <Link href="/login" className="rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-lg transition active:scale-95" style={{ background: 'linear-gradient(135deg, var(--ou-theme-accent, #0f172a), var(--ou-accent, #4f46e5))' }}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Navegação Mobile (Bottom Bar) */}
      <nav className="bottombar-shell sm:hidden flex items-center justify-around">
        <NavIcon active={currentPath === '/'} path="/" label="Feed">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
        </NavIcon>
        <NavIcon active={currentPath === '/timeline'} path="/timeline" label="Timeline">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </NavIcon>
        <NavIcon active={currentPath === '/settings'} path="/settings" label="Ajustes">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </NavIcon>
      </nav>
    </>
  )
}
