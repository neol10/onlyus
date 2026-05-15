import { useState } from 'react'
import { db } from '../src/firebase/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../src/context/AuthContext'

export default function NewEventForm() {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('Aniversário')
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [notifyPartner, setNotifyPartner] = useState(false)
  const categories = ['Aniversário', 'Mesversário', 'Viagem', 'Especial', 'Encontro', 'Primeira Vez']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile?.coupleId) {
      alert('Você precisa estar em uma sala de casal para registrar momentos.')
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, 'couples', profile.coupleId, 'events'), {
        title,
        description,
        date,
        type: type || 'Especial',
        createdAt: serverTimestamp(),
        authorId: user.uid,
        notifyPartner: notifyPartner,
      })
      setTitle('')
      setDescription('')
      setDate('')
      setType('Aniversário')
      setNotifyPartner(true)
    } catch (err) {
      console.error('Erro ao salvar evento', err)
      alert('Não foi possível salvar o evento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="soft-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Timeline</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">Novo momento</h3>
        </div>
        <span className="theme-pill px-3 py-1 text-xs font-semibold text-violet-700" style={{ borderRadius: '999px' }}>Registro</span>
      </div>
      
      <input
        placeholder="Título do Momento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="field-input mb-3"
      />
      
      <textarea
        placeholder="O que aconteceu? (Opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="field-input mb-3 min-h-[100px]"
        rows={2}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="field-input"
        />
        <div className="relative group">
          <input
            placeholder="Categoria..."
            value={type}
            onChange={(e) => setType(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="field-input"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className={`h-4 w-4 fill-current transition-transform ${showSuggestions ? 'rotate-180' : ''}`} viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
          </div>
          
          {showSuggestions && (
            <div className="absolute left-0 right-0 z-50 mt-2 max-h-48 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in duration-200 dark:bg-slate-900 dark:border-white/10">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sugestões</p>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setType(cat)
                    setShowSuggestions(false)
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 transition hover:bg-pink-50 dark:border-pink-500/20 dark:bg-pink-500/5">
          <input 
            type="checkbox" 
            checked={notifyPartner} 
            onChange={e => setNotifyPartner(e.target.checked)}
            className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500" 
          />
          <span className="text-xs font-bold text-pink-700 dark:text-pink-400">Marcar {profile?.settings?.partnerNick || 'o Amor'} 🔔</span>
        </label>
      </div>

      <button className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60 mt-2" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar na Timeline'}
      </button>
    </form>
  )
}
