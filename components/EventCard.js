export default function EventCard({ event = {} }) {
  const { title = 'Evento', description = '', date = '', type = 'custom' } = event

  const palette = {
    anniversary: 'from-fuchsia-500 to-rose-500',
    mesversario: 'from-violet-500 to-indigo-500',
    trip: 'from-emerald-500 to-teal-500',
    special: 'from-amber-500 to-orange-500',
    custom: 'from-slate-950 to-slate-700',
  }

  const badgeClass = palette[type] || palette.custom

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
        <span className={`bg-gradient-to-r ${badgeClass} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white whitespace-nowrap shadow-sm`} style={{ borderRadius: '999px' }}>
          {type}
        </span>
      </header>
      {description && <p className="px-5 py-4 text-sm leading-6 text-slate-700">{description}</p>}
    </article>
  )
}
