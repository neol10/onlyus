import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../src/firebase/firebaseClient'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const normalizeEmail = (value) => value.trim().toLowerCase()

  const getFriendlyError = (error) => {
    switch (error?.code) {
      case 'auth/email-already-in-use':
        return 'Esse e-mail já está em uso.'
      case 'auth/invalid-email':
        return 'Digite um e-mail válido.'
      case 'auth/weak-password':
        return 'A senha precisa ter pelo menos 6 caracteres.'
      case 'auth/configuration-not-found':
        return 'Ative Email/Senha em Firebase Console > Authentication > Sign-in method.'
      default:
        return error?.message || 'Falha ao criar conta.'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!auth) {
      setErrorMessage('Firebase não configurado. Preencha `.env.local` com as credenciais do projeto.')
      return
    }

    const cleanEmail = normalizeEmail(email)
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Digite um e-mail válido.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, password)
      router.push('/')
    } catch (error) {
      console.error('Erro ao cadastrar', error)
      setErrorMessage(getFriendlyError(error))
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="soft-card relative overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_30%)]" />
          <div className="relative max-w-xl">
            <span className="theme-pill inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ borderRadius: '999px' }}>
              Comece o OnlyUs
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">Espaço romântico, harmônico e privado do seu parceiro.</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Crie seu refúgio digital exclusivo para guardar cada capítulo dessa história com elegância e carinho.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Cadastro rápido', 'Design premium', 'Memórias privadas'].map((item) => (
                <div key={item} className="theme-pill px-4 py-3 text-sm font-medium text-slate-700" style={{ borderRadius: '1rem' }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <form onSubmit={handleSubmit} className="soft-card p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Primeiro usuário</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Criar conta</h2>
            </div>
            {errorMessage && (
              <div className="mb-4 rounded-2xl border border-rose-200 px-4 py-3 text-sm text-rose-700" style={{ background: 'linear-gradient(145deg, rgba(255,241,242,0.95), rgba(255,228,230,0.9))' }}>
                {errorMessage}
              </div>
            )}
            <label className="field-label">Email</label>
            <input className="field-input mb-4" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
            <label className="field-label">Senha</label>
            <input type="password" className="field-input mb-5" value={password} onChange={e => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
            <button className="primary-button w-full">Cadastrar</button>
            <div className="mt-5 text-center text-sm text-slate-600">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-600">
                Entrar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
