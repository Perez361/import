export interface StoreTheme {
  id: number
  heroBg: string
  heroGradient: string
  heroText: string
  heroSubText: string
  heroAccent: string
  heroBadgeBg: string
  heroBadgeText: string
  heroBadgeBorder: string
  headerBg: string
  headerBorder: string
  cardBg: string
  cardBorder: string
  cardHoverShadow: string
  cardNameColor: string
  priceColor: string
  btnBg: string
  btnText: string
  btnHoverBg: string
  addedBg: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  footerBg: string
  footerText: string
  fontDisplay: string
  pillBg: string
  pillText: string
  pillBorder: string
}

function hashSlug(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  return hash
}

const themes: StoreTheme[] = [
  {
    // 0 — Midnight Amber (original, refined)
    id: 0,
    heroBg: '#0F172A',
    heroGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    heroText: '#F8FAFC',
    heroSubText: '#94A3B8',
    heroAccent: '#F59E0B',
    heroBadgeBg: 'rgba(245,158,11,0.12)',
    heroBadgeText: '#F59E0B',
    heroBadgeBorder: 'rgba(245,158,11,0.25)',
    headerBg: 'rgba(255,255,255,0.85)',
    headerBorder: 'rgba(0,0,0,0.06)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardHoverShadow: '0 20px 40px rgba(0,0,0,0.12)',
    cardNameColor: '#0F172A',
    priceColor: '#B45309',
    btnBg: '#0F172A',
    btnText: '#FFFFFF',
    btnHoverBg: '#F59E0B',
    addedBg: '#10B981',
    badgeBg: 'rgba(245,158,11,0.1)',
    badgeText: '#B45309',
    badgeBorder: 'rgba(245,158,11,0.3)',
    footerBg: '#0F172A',
    footerText: '#64748B',
    fontDisplay: "'Playfair Display', Georgia, serif",
    pillBg: 'rgba(255,255,255,0.08)',
    pillText: '#CBD5E1',
    pillBorder: 'rgba(255,255,255,0.12)',
  },
  {
    // 1 — Deep Navy Crimson
    id: 1,
    heroBg: '#1a1a2e',
    heroGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    heroText: '#E8E8F0',
    heroSubText: '#9090A8',
    heroAccent: '#E94560',
    heroBadgeBg: 'rgba(233,69,96,0.12)',
    heroBadgeText: '#E94560',
    heroBadgeBorder: 'rgba(233,69,96,0.25)',
    headerBg: 'rgba(255,255,255,0.9)',
    headerBorder: 'rgba(0,0,0,0.06)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardHoverShadow: '0 20px 40px rgba(233,69,96,0.15)',
    cardNameColor: '#1a1a2e',
    priceColor: '#E94560',
    btnBg: '#0f3460',
    btnText: '#FFFFFF',
    btnHoverBg: '#E94560',
    addedBg: '#10B981',
    badgeBg: 'rgba(233,69,96,0.08)',
    badgeText: '#E94560',
    badgeBorder: 'rgba(233,69,96,0.25)',
    footerBg: '#1a1a2e',
    footerText: '#6060A0',
    fontDisplay: "'Georgia', serif",
    pillBg: 'rgba(255,255,255,0.06)',
    pillText: '#B0B0C8',
    pillBorder: 'rgba(255,255,255,0.1)',
  },
  {
    // 2 — Forest Gold
    id: 2,
    heroBg: '#0D4B3B',
    heroGradient: 'linear-gradient(135deg, #0D4B3B 0%, #155e44 100%)',
    heroText: '#F0FDF4',
    heroSubText: '#86EFAC',
    heroAccent: '#FCD34D',
    heroBadgeBg: 'rgba(252,211,77,0.12)',
    heroBadgeText: '#FCD34D',
    heroBadgeBorder: 'rgba(252,211,77,0.25)',
    headerBg: 'rgba(255,255,255,0.92)',
    headerBorder: 'rgba(0,0,0,0.06)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardHoverShadow: '0 20px 40px rgba(13,75,59,0.15)',
    cardNameColor: '#064E3B',
    priceColor: '#059669',
    btnBg: '#065F46',
    btnText: '#FFFFFF',
    btnHoverBg: '#FCD34D',
    addedBg: '#10B981',
    badgeBg: 'rgba(252,211,77,0.1)',
    badgeText: '#92400E',
    badgeBorder: 'rgba(252,211,77,0.3)',
    footerBg: '#064E3B',
    footerText: '#6EE7B7',
    fontDisplay: "'Trebuchet MS', sans-serif",
    pillBg: 'rgba(255,255,255,0.08)',
    pillText: '#A7F3D0',
    pillBorder: 'rgba(255,255,255,0.12)',
  },
  {
    // 3 — Violet Luxe
    id: 3,
    heroBg: '#1C0533',
    heroGradient: 'linear-gradient(135deg, #1C0533 0%, #2D0A4E 50%, #1C0533 100%)',
    heroText: '#FAF5FF',
    heroSubText: '#C4B5FD',
    heroAccent: '#A855F7',
    heroBadgeBg: 'rgba(168,85,247,0.12)',
    heroBadgeText: '#C084FC',
    heroBadgeBorder: 'rgba(168,85,247,0.25)',
    headerBg: 'rgba(255,255,255,0.9)',
    headerBorder: 'rgba(0,0,0,0.06)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardHoverShadow: '0 20px 40px rgba(168,85,247,0.15)',
    cardNameColor: '#3B0764',
    priceColor: '#7C3AED',
    btnBg: '#6D28D9',
    btnText: '#FFFFFF',
    btnHoverBg: '#A855F7',
    addedBg: '#10B981',
    badgeBg: 'rgba(168,85,247,0.08)',
    badgeText: '#7C3AED',
    badgeBorder: 'rgba(168,85,247,0.25)',
    footerBg: '#1C0533',
    footerText: '#7C3AED',
    fontDisplay: "'Palatino Linotype', Palatino, serif",
    pillBg: 'rgba(255,255,255,0.06)',
    pillText: '#DDD6FE',
    pillBorder: 'rgba(255,255,255,0.1)',
  },
  {
    // 4 — Ember Dark
    id: 4,
    heroBg: '#1A0A00',
    heroGradient: 'linear-gradient(135deg, #1A0A00 0%, #2D1200 100%)',
    heroText: '#FFF7ED',
    heroSubText: '#FDBA74',
    heroAccent: '#F97316',
    heroBadgeBg: 'rgba(249,115,22,0.12)',
    heroBadgeText: '#FB923C',
    heroBadgeBorder: 'rgba(249,115,22,0.25)',
    headerBg: 'rgba(255,255,255,0.92)',
    headerBorder: 'rgba(0,0,0,0.06)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardHoverShadow: '0 20px 40px rgba(249,115,22,0.15)',
    cardNameColor: '#431407',
    priceColor: '#C2410C',
    btnBg: '#C2410C',
    btnText: '#FFFFFF',
    btnHoverBg: '#F97316',
    addedBg: '#10B981',
    badgeBg: 'rgba(249,115,22,0.1)',
    badgeText: '#C2410C',
    badgeBorder: 'rgba(249,115,22,0.3)',
    footerBg: '#1A0A00',
    footerText: '#9A3412',
    fontDisplay: "'Arial Black', 'Impact', sans-serif",
    pillBg: 'rgba(255,255,255,0.07)',
    pillText: '#FED7AA',
    pillBorder: 'rgba(255,255,255,0.12)',
  },
  {
    // 5 — Ocean Blueprint
    id: 5,
    heroBg: '#0C1A2E',
    heroGradient: 'linear-gradient(135deg, #0C1A2E 0%, #1E3A5F 100%)',
    heroText: '#EFF6FF',
    heroSubText: '#93C5FD',
    heroAccent: '#3B82F6',
    heroBadgeBg: 'rgba(59,130,246,0.12)',
    heroBadgeText: '#60A5FA',
    heroBadgeBorder: 'rgba(59,130,246,0.25)',
    headerBg: 'rgba(255,255,255,0.9)',
    headerBorder: 'rgba(0,0,0,0.06)',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardHoverShadow: '0 20px 40px rgba(59,130,246,0.15)',
    cardNameColor: '#1E3A5F',
    priceColor: '#1D4ED8',
    btnBg: '#1D4ED8',
    btnText: '#FFFFFF',
    btnHoverBg: '#3B82F6',
    addedBg: '#10B981',
    badgeBg: 'rgba(59,130,246,0.08)',
    badgeText: '#1D4ED8',
    badgeBorder: 'rgba(59,130,246,0.25)',
    footerBg: '#0C1A2E',
    footerText: '#1D4ED8',
    fontDisplay: "'Courier New', Courier, monospace",
    pillBg: 'rgba(255,255,255,0.07)',
    pillText: '#BFDBFE',
    pillBorder: 'rgba(255,255,255,0.1)',
  },
]

export function getStoreTheme(slug: string): StoreTheme {
  const hash = hashSlug(slug)
  return themes[hash % themes.length]
}