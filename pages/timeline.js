import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import NavBar from '../components/NavBar'
import NewEventForm from '../components/NewEventForm'
import EventCard from '../components/EventCard'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'

export default function TimelinePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (loading || !user || !db || !profile?.coupleId) return
    const q = query(collection(db, 'couples', profile.coupleId, 'events'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [loading, user, profile?.coupleId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl animate-bounce mx-auto">
            <span className="text-white font-black text-xl">O</span>
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Sincronizando Amor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="page-shell">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div className="soft-card p-6 sm:p-8">
            <span className="theme-pill inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ borderRadius: '999px' }}>
              Linha do tempo
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Registre os marcos do relacionamento com mais presença.</h1>
            <p className="section-subtitle">
              Datas especiais, lembranças e pequenos detalhes em uma timeline bonita, simples e fácil de revisitar.
            </p>
          </div>
          <div className="soft-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Momento</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{events.length} registrados</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
          <div className="space-y-6">
            <NewEventForm />
            <div className="soft-card p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Sugestão</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Anote os marcos principais primeiro; isso ajuda a timeline a ficar mais emocional e organizada.</p>
            </div>
          </div>

          <section className="space-y-4">
            {events.length === 0 && (
              <div className="soft-card p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Sem marcos</p>
                <p className="mt-3 text-lg font-medium text-slate-900">Nenhum momento registrado ainda.</p>
              </div>
            )}
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </section>
        </section>
      </main>
    </div>
  )
}
