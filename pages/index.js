import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import PostCard from '../components/PostCard'
import NewPostForm from '../components/NewPostForm'
import LoveTimer from '../components/LoveTimer'
import LovePing from '../components/LovePing'
import ThrowbackCard from '../components/ThrowbackCard'
import CollabRoom from '../components/CollabRoom'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../src/context/AuthContext'
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'
import MusicCard from '../components/MusicCard'
import LocationCard from '../components/LocationCard'
import { useToast } from '../src/context/ToastContext'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [coupleData, setCoupleData] = useState({ relationshipDate: '', myMood: '🥰', pinOnPosts: false, blurPhotos: false, pinCode: '' })
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [showMoodSelector, setShowMoodSelector] = useState(false)

  const MOOD_OPTIONS = ['🥰', '❤️', '😊', '🤩', '😴', '😢', '😤', '🥺', '🤯', '🥵', '😁', '🫶', '😍', '🤭', '🥳', '😌', '🫠', '🫰', '🤍', '✨']

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (loading || !user || !db || !profile?.coupleId) return
    
    // Busca apenas o contador de posts (e dados para o Throwback)
    const q = query(collection(db, 'couples', profile.coupleId, 'posts'), orderBy('createdAt', 'desc'))
    const unsubPosts = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setPosts(arr)
    })

    // Escuta os dados da sala do casal (Data, Humores, etc)
    const coupleRef = doc(db, 'couples', profile.coupleId)
    const unsubCouple = onSnapshot(coupleRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const partnerId = data.partnerA === user.uid ? data.partnerB : data.partnerA
        
        setCoupleData({
          relationshipDate: data.relationshipDate || '',
          myMood: data.moods?.[user.uid] || '🥰',
          partnerMood: data.moods?.[partnerId] || '🥰',
          partnerNick: profile?.settings?.partnerNick || 'O Amor',
          partnerId: partnerId,
          pinOnPosts: data.settings?.pinOnPosts || false,
          blurPhotos: data.settings?.blurPhotos || false,
          pinCode: data.settings?.pinCode || '',
          theme: data.settings?.theme || 'Aurora'
        })
      }
    })

    return () => { unsubPosts(); unsubCouple() }
  }, [user, profile?.coupleId, loading])

  const { showToast } = useToast()

  const saveCoupleData = async (newData) => {
    if (!user || !db || !profile?.coupleId) return
    const coupleRef = doc(db, 'couples', profile.coupleId)
    
    if (newData.myMood) {
      await updateDoc(coupleRef, { [`moods.${user.uid}`]: newData.myMood })
      const notifRef = doc(db, 'couples', profile.coupleId, 'notifications', 'latest')
      await setDoc(notifRef, {
        from: user.uid,
        message: `${profile.displayName || 'Seu Amor'} atualizou o humor para: ${newData.myMood}`,
        timestamp: Date.now(),
        type: 'mood'
      })
    }
    
    if (newData.relationshipDate !== undefined) {
      await updateDoc(coupleRef, { relationshipDate: newData.relationshipDate })
    }
  }

  const [activeTab, setActiveTab] = useState('feed')

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
    <div className="min-h-screen pb-24">
      <NavBar />
      
      {!profile?.coupleId ? (
        <CollabRoom />
      ) : (
        <>
          <LovePing />
          <main className="page-shell pt-4">
            {/* Tab Switcher */}
            <div className="flex justify-center mb-8 sticky top-20 z-40 px-4">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl flex gap-1 w-full max-w-md">
                <button 
                  onClick={() => setActiveTab('feed')}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'feed' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                  Resumo 📋
                </button>
                <button 
                  onClick={() => setActiveTab('radar')}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'radar' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                  Radar 📍
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'feed' ? (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Grid Principal Superior — Ultra Responsivo */}
                  <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr] items-start">
                    {/* Coluna Esquerda: LoveTimer e Música */}
                    <div className="flex flex-col gap-4 w-full">
                      <div className="soft-card p-5 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                          <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </div>
                        
                        <div>
                          <span className="theme-pill inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] rounded-full">
                            Nosso Tempo
                          </span>
                          
                          <div className="mt-5">
                            {coupleData.relationshipDate && !isEditingDate ? (
                              <div onClick={() => setIsEditingDate(true)} className="cursor-pointer group">
                                <LoveTimer startDate={coupleData.relationshipDate} />
                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Toque para editar a data</p>
                              </div>
                            ) : (
                              <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl backdrop-blur-sm border border-[var(--ou-accent-soft)]">
                                <p className="text-xs font-semibold mb-2">Quando a história começou?</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="date" 
                                    value={coupleData.relationshipDate}
                                    onChange={(e) => saveCoupleData({ relationshipDate: e.target.value })}
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--ou-accent)]"
                                  />
                                  <button onClick={() => setIsEditingDate(false)} className="px-4 bg-[var(--ou-accent)] text-white rounded-xl text-xs font-bold">Salvar</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <MusicCard coupleId={profile?.coupleId} />
                    </div>

                    {/* Coluna Direita: Status rápidos sem caixa redundante por fora para responsividade premium */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 w-full">
                      {/* Live Presence */}
                      <div className="soft-card px-5 py-4 bg-gradient-to-br from-[var(--ou-card-bg)] to-[var(--ou-card-bg-2)] relative overflow-hidden flex items-center justify-between lg:flex-col lg:items-start lg:justify-center gap-2 min-h-[84px]">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 leading-none">Live Presence</p>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1.5 block">Sincronizados</span>
                        </div>
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        </span>
                      </div>
                      
                      {/* Seu Humor */}
                      <div className="soft-card px-5 py-4 bg-gradient-to-br from-[var(--ou-card-bg)] to-[var(--ou-card-bg-2)] flex items-center justify-between gap-4 min-h-[84px]">
                        <div className="flex-1">
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 leading-none mb-1.5">Seu Humor</p>
                          <button
                            onClick={() => setShowMoodSelector(!showMoodSelector)}
                            className="flex items-center gap-1.5 hover:opacity-85 active:scale-95 transition-all text-left"
                          >
                            <span className="text-3xl drop-shadow-sm select-none">{coupleData.myMood}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase underline underline-offset-2 decoration-dotted">Mudar</span>
                          </button>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 leading-none mb-1.5">{coupleData.partnerNick}</p>
                          <span className="text-3xl drop-shadow-sm select-none">{coupleData.partnerMood}</span>
                        </div>
                      </div>

                      {/* Total de Memórias */}
                      <div className="soft-card px-5 py-4 bg-gradient-to-br from-[var(--ou-card-bg)] to-[var(--ou-card-bg-2)] flex items-center justify-between lg:flex-col lg:items-start lg:justify-center gap-1 min-h-[84px]">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400 leading-none">Total de Memórias</p>
                          <p className="mt-1 text-sm font-extrabold text-[var(--ou-accent)]">{posts.length} gravadas</p>
                        </div>
                        <Link href="/timeline" className="text-[9px] font-black uppercase text-indigo-500 hover:underline">Ver todas →</Link>
                      </div>
                    </div>
                  </section>

                  {/* Grid Principal Inferior: Throwback e Últimas Memórias */}
                  <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] xl:grid-cols-[0.7fr_1.3fr] items-start">
                    {/* Lado Esquerdo: Lembrança Antiga (Throwback) */}
                    <div className="w-full">
                      <ThrowbackCard posts={posts} />
                    </div>

                    {/* Lado Direito: Lembranças Recentes Reais (substitui o card estático 'Resumo do Dia') */}
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Últimos Momentos 📸</h3>
                        {posts.length > 3 && (
                          <Link href="/timeline" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            Ver mais ({posts.length}) →
                          </Link>
                        )}
                      </div>

                      {posts.length === 0 ? (
                        <div className="soft-card p-8 text-center bg-white/50 dark:bg-white/5 border-dashed">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Nenhuma memória ainda</p>
                          <p className="text-xs text-slate-400 mt-2">Que tal postar o primeiro momento de vocês na Timeline?</p>
                          <Link href="/timeline">
                            <button className="primary-button mt-4 px-4 py-2 text-xs font-bold">Publicar Agora 📸</button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {posts.slice(0, 2).map((post) => (
                            <PostCard key={post.id} post={post} settings={coupleData} />
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div 
                  key="radar"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="soft-card p-6 min-h-[500px]">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500 mb-1">Nosso Mapa</p>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Onde estamos agora?</h2>
                    </div>
                    <LocationCard coupleId={profile?.coupleId} />
                    
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Dica de Privacidade</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">As localizações são compartilhadas apenas entre vocês dois. O histórico não é armazenado permanentemente.</p>
                      </div>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Life360 Style</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">Toque no marcador para ver os detalhes de endereço e bateria do seu amor.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
      {/* Bottom Sheet — Seletor de Humor (fora do card para evitar overflow) */}
      <AnimatePresence>
        {showMoodSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-end justify-center"
            onClick={() => setShowMoodSelector(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />

              <p className="text-sm font-black text-slate-900 dark:text-white text-center mb-4">Como você está se sentindo?</p>

              {/* Presets */}
              <div className="grid grid-cols-5 gap-2 mb-5">
                {MOOD_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      saveCoupleData({ myMood: emoji })
                      setShowMoodSelector(false)
                    }}
                    className="text-3xl flex items-center justify-center h-12 w-12 mx-auto rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Campo livre com autoFocus — abre teclado no celular */}
              <div className="border-t border-slate-100 dark:border-white/10 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 text-center">Ou digite qualquer emoji</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="🥰"
                    className="flex-1 text-center text-3xl bg-slate-50 dark:bg-white/5 border-2 border-indigo-300 dark:border-indigo-500/40 rounded-2xl py-3 outline-none focus:border-indigo-500"
                    onChange={e => {
                      const chars = [...e.target.value.trim()]
                      if (chars.length >= 1) {
                        saveCoupleData({ myMood: chars[0] })
                        setShowMoodSelector(false)
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const chars = [...e.target.value.trim()]
                        if (chars.length >= 1) {
                          saveCoupleData({ myMood: chars[0] })
                          setShowMoodSelector(false)
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={e => {
                      const input = e.currentTarget.previousSibling
                      const chars = [...input.value.trim()]
                      if (chars.length >= 1) {
                        saveCoupleData({ myMood: chars[0] })
                        setShowMoodSelector(false)
                      }
                    }}
                    className="px-5 py-3 bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-600 active:scale-95 transition-all"
                  >
                    Usar
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">No celular: troque para o teclado de emoji 😊</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  )
}
