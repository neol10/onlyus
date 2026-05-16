import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import NavBar from '../components/NavBar'
import NewEventForm from '../components/NewEventForm'
import EventCard from '../components/EventCard'
import NewPostForm from '../components/NewPostForm'
import PostCard from '../components/PostCard'
import { useAuth } from '../src/context/AuthContext'
import { db } from '../src/firebase/firebaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function TimelinePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [activeView, setActiveView] = useState('posts') // 'posts' ou 'events'

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (loading || !user || !db || !profile?.coupleId) return
    
    // Escuta Eventos
    const qEvents = query(collection(db, 'couples', profile.coupleId, 'events'), orderBy('date', 'desc'))
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })

    // Escuta Posts
    const qPosts = query(collection(db, 'couples', profile.coupleId, 'posts'), orderBy('createdAt', 'desc'))
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => { unsubEvents(); unsubPosts() }
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
    <div className="min-h-screen pb-20">
      <NavBar />
      <main className="page-shell">
        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div className="soft-card p-6 sm:p-8">
            <span className="theme-pill inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ borderRadius: '999px' }}>
              Histórico do Casal
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Nossa Jornada em um só lugar.</h1>
            <p className="section-subtitle">
              De fotos casuais a grandes marcos, tudo o que vivemos está guardado aqui para sempre.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="soft-card p-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500">Memórias</span>
              <span className="text-xl font-bold text-indigo-600">{posts.length}</span>
            </div>
            <div className="soft-card p-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500">Marcos</span>
              <span className="text-xl font-bold text-rose-500">{events.length}</span>
            </div>
          </div>
        </section>

        {/* Seletor de Visualização */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl flex gap-1 w-full max-w-md">
            <button 
              onClick={() => setActiveView('posts')}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'posts' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              Memórias 📸
            </button>
            <button 
              onClick={() => setActiveView('events')}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeView === 'events' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              Marcos 🏆
            </button>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {activeView === 'posts' ? (
                <motion.div key="form-posts" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <NewPostForm />
                </motion.div>
              ) : (
                <motion.div key="form-events" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <NewEventForm />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="soft-card p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Dica</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {activeView === 'posts' 
                  ? "As memórias são fotos do dia a dia. Você pode trancar fotos sensíveis com PIN." 
                  : "Os marcos são datas especiais como aniversário de namoro, primeira viagem, etc."}
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <AnimatePresence mode="wait">
              {activeView === 'posts' ? (
                <motion.div key="list-posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {posts.length === 0 && (
                    <div className="soft-card p-8 text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Sem memórias</p>
                      <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">Nenhuma foto registrada ainda.</p>
                    </div>
                  )}
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </motion.div>
              ) : (
                <motion.div key="list-events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {events.length === 0 && (
                    <div className="soft-card p-8 text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Sem marcos</p>
                      <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">Nenhum marco registrado ainda.</p>
                    </div>
                  )}
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </section>
      </main>
    </div>
  )
}
