import { DEFAULT_AVATAR_STYLE } from '@tds/types'

export type AvatarActor = { avatarUrl?: string | null; displayName: string; id?: string }

// Pixel ladder for every AgentAvatar / MockAvatar face. Keep display-class maps in the UI layers
// (Tailwind / RN) derived from these numbers so marketing and the app cannot drift.
export const AVATAR_SIZE_PX = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 64,
} as const

export type AvatarSize = keyof typeof AVATAR_SIZE_PX

// Tailwind size utilities matching AVATAR_SIZE_PX (h-N w-N where N = px/4).
export const AVATAR_SIZE_CLASS = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-16 w-16',
} as const

// Semantic slots — change MESSAGE_AVATAR_SIZE once to resize the conversation gutter (app + demos).
export const MESSAGE_AVATAR_SIZE: AvatarSize = 'md'
export const MESSAGE_AVATAR_PX = AVATAR_SIZE_PX[MESSAGE_AVATAR_SIZE]
// Hover / popover face next to a message avatar — one step larger so the card reads as detail.
export const MESSAGE_ACTOR_CARD_AVATAR_SIZE: AvatarSize = 'lg'
// Dense progress chips (Task › Plan › Build) stay smaller than the stream.
export const PROGRESS_ACTOR_AVATAR_SIZE: AvatarSize = 'xs'

// Which of the three things an avatar can be. The DiceBear render itself stays per-client (one draws
// SVG markup, the other react-native-svg), but what to draw is decided once.
export type AvatarSource =
  | { kind: 'image'; url: string }
  | { kind: 'generated'; styleId: string; seed: string }
  | { kind: 'placeholder' }

// avatarUrl encodes three kinds of value:
//   null                        → default face (team style + actor id)
//   "avatar:{styleId}:{seed}"   → pinned generated face (survives team style switches)
//   "https://..."               → uploaded photo
const AVATAR_REF_PREFIX = 'avatar:'

export function formatAvatarRef(styleId: string, seed: string): string {
  return `${AVATAR_REF_PREFIX}${styleId}:${seed}`
}

export function parseAvatarRef(url: string): { styleId: string; seed: string } | null {
  if (!url.startsWith(AVATAR_REF_PREFIX)) return null
  const rest = url.slice(AVATAR_REF_PREFIX.length)
  const i = rest.indexOf(':')
  if (i < 1) return null
  return { styleId: rest.slice(0, i), seed: rest.slice(i + 1) }
}

// An uploaded image wins, unless a style override forces a generated one — the override exists so
// the team's style picker can preview each option, which an uploaded photo would hide.
//
// The seed is the actor's id when there is one: it is globally unique, while displayName is
// user-entered and repeats, so two people named "Alex" would otherwise share a face.
export function avatarSource(
  actor: AvatarActor | null,
  styleOverride: string | undefined,
  teamAvatarStyle: string | null | undefined,
): AvatarSource {
  if (actor?.avatarUrl && !styleOverride) {
    const ref = parseAvatarRef(actor.avatarUrl)
    if (ref) return { kind: 'generated', styleId: ref.styleId, seed: ref.seed }
    return { kind: 'image', url: actor.avatarUrl }
  }
  if (!actor && !styleOverride) return { kind: 'placeholder' }
  const styleId = styleOverride ?? teamAvatarStyle ?? DEFAULT_AVATAR_STYLE
  return { kind: 'generated', styleId, seed: actor?.id ?? actor?.displayName ?? styleId }
}

// A project's letter badge colour, hashed off its name so the same project wears the same colour on
// both clients and in the marketing mocks. Three copies of this used to sit side by side.
const BADGE_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  'bg-orange-500', 'bg-indigo-500',
]

export function projectBadgeColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length]
}
