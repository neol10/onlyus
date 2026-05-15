const THEME_MAP = {
  Aurora: {
    accent: '#4f46e5',
    accentSoft: 'rgba(79, 70, 229, 0.18)',
    accentStrong: 'rgba(79, 70, 229, 0.34)',
    accent2: '#ec4899',
    accent2Soft: 'rgba(236, 72, 153, 0.14)',
    surfaceGlow: 'rgba(255, 255, 255, 0.95)',
    bgStart: '#f8fafc',
    bgMid: '#eef2ff',
    bgEnd: '#faf5ff',
    cardBg: 'rgba(245, 243, 255, 0.95)',
    cardBg2: 'rgba(236, 254, 255, 0.9)',
    topbarBg: 'rgba(255, 255, 255, 0.82)',
  },
  Midnight: {
    accent: '#0f172a',
    accentSoft: 'rgba(15, 23, 42, 0.22)',
    accentStrong: 'rgba(15, 23, 42, 0.38)',
    accent2: '#60a5fa',
    accent2Soft: 'rgba(96, 165, 250, 0.16)',
    surfaceGlow: 'rgba(255, 255, 255, 0.92)',
    bgStart: '#eef2ff',
    bgMid: '#dbeafe',
    bgEnd: '#c7d2fe',
    cardBg: 'rgba(226, 232, 240, 0.95)',
    cardBg2: 'rgba(219, 234, 254, 0.9)',
    topbarBg: 'rgba(241, 245, 249, 0.86)',
  },
  Blossom: {
    accent: '#db2777',
    accentSoft: 'rgba(219, 39, 119, 0.18)',
    accentStrong: 'rgba(219, 39, 119, 0.34)',
    accent2: '#f97316',
    accent2Soft: 'rgba(249, 115, 22, 0.14)',
    surfaceGlow: 'rgba(255, 255, 255, 0.96)',
    bgStart: '#fff1f2',
    bgMid: '#fce7f3',
    bgEnd: '#ffe4e6',
    cardBg: 'rgba(255, 228, 230, 0.95)',
    cardBg2: 'rgba(254, 249, 195, 0.86)',
    topbarBg: 'rgba(255, 240, 245, 0.88)',
  },
  Noir: {
    accent: '#09090b',
    accentSoft: 'rgba(9, 9, 11, 0.24)',
    accentStrong: 'rgba(9, 9, 11, 0.4)',
    accent2: '#71717a',
    accent2Soft: 'rgba(113, 113, 122, 0.16)',
    surfaceGlow: 'rgba(255, 255, 255, 0.9)',
    bgStart: '#e2e8f0',
    bgMid: '#cbd5e1',
    bgEnd: '#94a3b8',
    cardBg: 'rgba(226, 232, 240, 0.94)',
    cardBg2: 'rgba(203, 213, 225, 0.9)',
    topbarBg: 'rgba(241, 245, 249, 0.9)',
  },
  Custom: {
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.18)',
    accentStrong: 'rgba(37, 99, 235, 0.34)',
    accent2: '#a855f7',
    accent2Soft: 'rgba(168, 85, 247, 0.14)',
    surfaceGlow: 'rgba(255, 255, 255, 0.95)',
    bgStart: '#f0f9ff',
    bgMid: '#e0f2fe',
    bgEnd: '#ede9fe',
    cardBg: 'rgba(239, 246, 255, 0.95)',
    cardBg2: 'rgba(250, 245, 255, 0.9)',
    topbarBg: 'rgba(240, 249, 255, 0.88)',
  },
}

const SURFACE_MAP = {
  Tema: null,
  Pérola: {
    cardBg: 'rgba(255, 255, 255, 0.96)',
    cardBg2: 'rgba(244, 247, 255, 0.92)',
    topbarBg: 'rgba(255, 255, 255, 0.86)',
  },
  Gelo: {
    cardBg: 'rgba(239, 246, 255, 0.96)',
    cardBg2: 'rgba(224, 242, 254, 0.92)',
    topbarBg: 'rgba(240, 249, 255, 0.9)',
  },
  Areia: {
    cardBg: 'rgba(255, 248, 240, 0.96)',
    cardBg2: 'rgba(254, 243, 199, 0.9)',
    topbarBg: 'rgba(255, 250, 240, 0.9)',
  },
  Fumê: {
    cardBg: 'rgba(241, 245, 249, 0.96)',
    cardBg2: 'rgba(226, 232, 240, 0.92)',
    topbarBg: 'rgba(248, 250, 252, 0.9)',
  },
  Grafite: {
    cardBg: 'rgba(30, 41, 59, 0.92)',
    cardBg2: 'rgba(15, 23, 42, 0.94)',
    topbarBg: 'rgba(15, 23, 42, 0.88)',
  },
  Personalizada: null,
}

const MODE_MAP = {
  Claro: {
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    borderSoft: 'rgba(148, 163, 184, 0.35)',
    inputPlaceholder: '#94a3b8',
    panelOverlay: 'rgba(255, 255, 255, 0.72)',
  },
  Escuro: {
    bgStart: '#0b1220',
    bgMid: '#111827',
    bgEnd: '#1f2937',
    surfaceGlow: 'rgba(59, 130, 246, 0.2)',
    cardBg: 'rgba(15, 23, 42, 0.9)',
    cardBg2: 'rgba(30, 41, 59, 0.88)',
    topbarBg: 'rgba(2, 6, 23, 0.86)',
    textPrimary: '#e2e8f0',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    borderSoft: 'rgba(100, 116, 139, 0.45)',
    inputPlaceholder: '#94a3b8',
    panelOverlay: 'rgba(15, 23, 42, 0.62)',
  },
}

export const DEFAULT_THEME_SETTINGS = {
  theme: 'Aurora',
  uiMode: 'Claro',
  primary: 'Azul gelo',
  secondary: 'Violeta',
  primaryHex: '#60a5fa',
  secondaryHex: '#8b5cf6',
  surfaceTone: 'Tema',
  surfaceHex: '#ffffff',
  backgroundIntensity: 70,
  motionIntensity: 60,
  privateFeed: true,
  pushNotifications: true,
  autoMemories: true,
  pinEnabled: false,
  pinCode: '',
  pinPhoto: '',
}

const COLOR_MAP = {
  'Azul gelo': '#60a5fa',
  Violeta: '#8b5cf6',
  Rosa: '#ec4899',
  Verde: '#10b981',
  Dourado: '#f59e0b',
  Personalizada: '#60a5fa',
}

function normalizeHex(value, fallback = '#60a5fa') {
  if (typeof value !== 'string') return fallback
  const raw = value.trim()
  if (!raw) return fallback
  const prefixed = raw.startsWith('#') ? raw : `#${raw}`
  const valid = /^#([0-9a-fA-F]{6})$/.test(prefixed)
  return valid ? prefixed.toLowerCase() : fallback
}

function hexToRgb(hex) {
  const safe = normalizeHex(hex)
  const clean = safe.replace('#', '')
  const int = Number.parseInt(clean, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function shiftHex(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  const shift = (v) => Math.max(0, Math.min(255, v + amount))
  const toHex = (v) => v.toString(16).padStart(2, '0')
  return `#${toHex(shift(r))}${toHex(shift(g))}${toHex(shift(b))}`
}

function getResolvedColor(label, customHex, fallbackLabel) {
  if (label === 'Personalizada') {
    return normalizeHex(customHex, COLOR_MAP[fallbackLabel])
  }
  return COLOR_MAP[label] || COLOR_MAP[fallbackLabel]
}

export function getThemeSettingsKey(userId) {
  return userId ? `onlyus-settings-${userId}` : 'onlyus-settings-guest'
}

export function readThemeSettings(storageKey) {
  if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS

  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return DEFAULT_THEME_SETTINGS

  try {
    return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_THEME_SETTINGS
  }
}

export function applyThemeToDocument(settings = DEFAULT_THEME_SETTINGS) {
  if (typeof document === 'undefined') return

  const theme = THEME_MAP[settings.theme] || THEME_MAP.Aurora
  const uiMode = settings.uiMode === 'Escuro' ? 'Escuro' : 'Claro'
  const mode = MODE_MAP[uiMode]
  const primary = getResolvedColor(settings.primary, settings.primaryHex, 'Azul gelo')
  const secondary = getResolvedColor(settings.secondary, settings.secondaryHex, 'Violeta')
  const surface = SURFACE_MAP[settings.surfaceTone] || null
  const intensity = Math.max(0, Math.min(100, Number(settings.backgroundIntensity ?? 70)))
  const motion = Math.max(0, Math.min(100, Number(settings.motionIntensity ?? 60)))
  const customSurfaceHex = normalizeHex(settings.surfaceHex, '#ffffff')
  const customSurface = {
    cardBg: withAlpha(customSurfaceHex, uiMode === 'Escuro' ? 0.28 : 0.96),
    cardBg2: withAlpha(shiftHex(customSurfaceHex, uiMode === 'Escuro' ? -18 : -6), uiMode === 'Escuro' ? 0.34 : 0.92),
    topbarBg: withAlpha(shiftHex(customSurfaceHex, uiMode === 'Escuro' ? -28 : -12), uiMode === 'Escuro' ? 0.42 : 0.9),
  }
  const effectiveSurface = settings.surfaceTone === 'Personalizada' ? customSurface : surface
  const preferCustomSurface = settings.surfaceTone === 'Personalizada'
  const cardBg = preferCustomSurface ? customSurface.cardBg : (uiMode === 'Escuro' ? mode.cardBg : (effectiveSurface?.cardBg || theme.cardBg))
  const cardBg2 = preferCustomSurface ? customSurface.cardBg2 : (uiMode === 'Escuro' ? mode.cardBg2 : (effectiveSurface?.cardBg2 || theme.cardBg2))
  const topbarBg = preferCustomSurface ? customSurface.topbarBg : (uiMode === 'Escuro' ? mode.topbarBg : (effectiveSurface?.topbarBg || theme.topbarBg))
  const bgStart = mode.bgStart || theme.bgStart
  const bgMid = mode.bgMid || theme.bgMid
  const bgEnd = mode.bgEnd || theme.bgEnd
  const surfaceGlow = mode.surfaceGlow || theme.surfaceGlow

  document.documentElement.dataset.theme = settings.theme || 'Aurora'
  document.documentElement.dataset.uiMode = uiMode
  document.documentElement.style.setProperty('--ou-accent', primary)
  document.documentElement.style.setProperty('--ou-accent-2', secondary)
  document.documentElement.style.setProperty('--ou-accent-soft', theme.accentSoft)
  document.documentElement.style.setProperty('--ou-accent-2-soft', theme.accent2Soft)
  document.documentElement.style.setProperty('--ou-surface-glow', surfaceGlow)
  document.documentElement.style.setProperty('--ou-bg-start', bgStart)
  document.documentElement.style.setProperty('--ou-bg-mid', bgMid)
  document.documentElement.style.setProperty('--ou-bg-end', bgEnd)
  document.documentElement.style.setProperty('--ou-bg-opacity', String(intensity / 100))
  document.documentElement.style.setProperty('--ou-motion-opacity', String(motion / 100))
  document.documentElement.style.setProperty('--ou-theme-accent', theme.accent)
  document.documentElement.style.setProperty('--ou-theme-accent-strong', theme.accentStrong)
  document.documentElement.style.setProperty('--ou-card-bg', cardBg)
  document.documentElement.style.setProperty('--ou-card-bg-2', cardBg2)
  document.documentElement.style.setProperty('--ou-topbar-bg', topbarBg)
  document.documentElement.style.setProperty('--ou-text-primary', mode.textPrimary)
  document.documentElement.style.setProperty('--ou-text-secondary', mode.textSecondary)
  document.documentElement.style.setProperty('--ou-text-muted', mode.textMuted)
  document.documentElement.style.setProperty('--ou-border-soft', mode.borderSoft)
  document.documentElement.style.setProperty('--ou-input-placeholder', mode.inputPlaceholder)
  document.documentElement.style.setProperty('--ou-panel-overlay', mode.panelOverlay)

  document.body.dataset.theme = settings.theme || 'Aurora'
  document.body.dataset.uiMode = uiMode
}

export function saveThemeSettings(storageKey, settings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to save theme settings:', err)
  }
}
