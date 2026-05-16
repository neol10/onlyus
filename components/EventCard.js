import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../src/firebase/firebaseClient'

export default function EventCard({ event = {}, coupleId }) {
  const { id: eventId, title = 'Evento', description = '', date = '', type = 'custom' } = event
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState(description)

  const palette = {
    anniversary: 'from-fuchsia-500 to-rose-500',
    mesversario: 'from-violet-500 to-indigo-500',
    trip: 'from-emerald-500 to-teal-500',
    special: 'from-amber-500 to-orange-500',
    custom: 'from-slate-950 to-slate-700',
  }

  const badgeClass = palette[type] || palette.custom

  const handleDelete = async () => {
    if (!coupleId || !eventId) return
    if (confirm('Tem certeza que deseja excluir este marco?')) {
      try {
        await deleteDoc(doc(db, 'couples', coupleId, 'events', eventId))
      } catch (err) {
        console.error('Erro ao excluir marco:', err)
        alert('Erro ao excluir marco')
      }
    }
  }

  const handleUpdate = async () => {
    if (!coupleId || !eventId) return
    try {
      await updateDoc(doc(db, 'couples', coupleId, 'events', eventId), {
        description: editDescription
      })
      setIsEditing(false)
    } catch (err) {
      console.error('Erro ao editar marco:', err)
      alert('Erro ao editar marco')
    }
  }

  return (
    <article className="soft-card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <header className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: 'color-mix(in srgb, var(--ou-accent-soft, rgba(99,102,241,0.14)) 50%, rgba(255,255,255,0.72))' }}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
            {event.notifyPartner && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400" title="Parceiro Notificado">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
              </span>
            )}
          </div>
          {date && <p className="mt-1 text-sm text-slate-500">{new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-indigo-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <span className={`bg-gradient-to-r ${badgeClass} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white whitespace-nowrap shadow-sm`} style={{ borderRadius: '999px' }}>
            {type}
          </span>
        </div>
      </header>

      <div className="px-5 py-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea 
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
              placeholder="Descreva este marco..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold text-slate-500">Cancelar</button>
              <button onClick={handleUpdate} className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20">Salvar</button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
            {description || 'Sem descrição para este marco.'}
          </p>
        )}
      </div>
    </article>
  )
}
