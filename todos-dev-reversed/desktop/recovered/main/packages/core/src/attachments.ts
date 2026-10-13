import { attachmentKind, type AttachmentKind } from '@tds/types'

// Marker bookkeeping for attachments, shared by both clients. The text a composer holds is the
// single source of truth for what's attached — these are the checks that read it, kept here so the
// scheme list can't be extended in one client and missed in the other.
//
// Pending image uploads and unresolved voice chips (chat's `transcribing:` marker, the spec editor's
// `voice-…:` markers) all block send/save. One scheme list feeds both the check and the stripper.
const PENDING_SCHEMES = String.raw`uploading|transcribing|voice-\w+`
const PENDING_MARKER_RE = new RegExp(String.raw`\]\((${PENDING_SCHEMES}):`)
const PENDING_CHIP_RE = new RegExp(String.raw`\[[^\]]*\]\((?:${PENDING_SCHEMES}):[^)]*\)`, 'g')

export function hasPendingUploads(text: string): boolean {
  return PENDING_MARKER_RE.test(text)
}

// Drop those chips, keeping the words around them. For text that outlives the page that typed it (a
// persisted draft): the upload or transcription died with the page, so the chip would come back
// pointing at nothing — and silently block send.
export function stripPendingMarkers(text: string): string {
  return text.replace(PENDING_CHIP_RE, '')
}

// Attachments already on the message plus the ones still uploading, which is what the
// per-message cap is counted against.
export function attachmentMarkerCount(text: string): number {
  return (text.match(/\]\((?:attachment|uploading):/g) ?? []).length
}

export interface AttachmentMarker {
  name: string
  scheme: 'attachment' | 'uploading'
  // Storage key for `attachment:`, upload id for `uploading:`.
  token: string
  // The matched text, for editing it back out of the composer.
  marker: string
  // Where it sits, for an editor that folds markers into chips and has to map edits back onto the
  // text they came from (apps/app/lib/chipText.ts).
  from: number
  to: number
}

// Reads a composer's live text, which holds finished and in-flight images alike. ATTACHMENT_MARKER_RE
// (@tds/types) stays the parser for stored message text — it only knows the finished scheme, and a
// placeholder must never reach the wire.
const COMPOSER_MARKER_RE = /!\[([^\]]*)\]\((attachment|uploading):([^)\s]+)\)/g

export function parseAttachmentMarkers(text: string): AttachmentMarker[] {
  return [...text.matchAll(COMPOSER_MARKER_RE)].map((m) => ({
    name: m[1] || 'file',
    scheme: m[2] as 'attachment' | 'uploading',
    token: m[3],
    marker: m[0],
    from: m.index ?? 0,
    to: (m.index ?? 0) + m[0].length,
  }))
}

// The words without the attachment markers — for surfaces that render attachments elsewhere
// entirely (the streaming pass, which has no signed URLs yet; plain-text derivations).
export function stripAttachmentMarkers(text: string): string {
  return text.replace(COMPOSER_MARKER_RE, '').replace(/[ \t]{2,}/g, ' ').trim()
}

export type AttachmentSegment =
  | { kind: 'text'; text: string }
  | { kind: 'attachments'; markers: AttachmentMarker[] }

// The text split around its markers, in document order — for surfaces that render attachments
// full-size where the author placed them (todo spec, feedback): which image belongs to which
// sentence is information, and a detached gallery loses it. Markers separated only by whitespace
// collapse into one strip; blank slices vanish.
export function splitAttachmentSegments(text: string): AttachmentSegment[] {
  const segments: AttachmentSegment[] = []
  let cursor = 0
  for (const marker of parseAttachmentMarkers(text)) {
    const between = text.slice(cursor, marker.from).trim()
    if (between) segments.push({ kind: 'text', text: between })
    const last = segments[segments.length - 1]
    if (last?.kind === 'attachments') last.markers.push(marker)
    else segments.push({ kind: 'attachments', markers: [marker] })
    cursor = marker.to
  }
  const tail = text.slice(cursor).trim()
  if (tail) segments.push({ kind: 'text', text: tail })
  return segments
}

// Where a marker's extension comes from, which changes mid-upload: a finished `attachment:` token is
// the storage key and carries the extension the route settled on, while an `uploading:` token is an
// opaque temp id, so the only clue is the display name minted from the original filename.
export function markerKind(marker: Pick<AttachmentMarker, 'name' | 'scheme' | 'token'>): AttachmentKind {
  return attachmentKind(marker.scheme === 'attachment' ? marker.token : marker.name)
}

// Whether a storage key points at something the UI can render as a picture. Bubbles and viewers ask
// this directly — they only ever hold finished markers, so the token is always the key.
export function isImageKey(key: string): boolean {
  return attachmentKind(key) === 'image'
}

// Whether a picked file goes down the image upload path (decode, downscale, re-encode) rather than
// being sent as-is. Deliberately broader than the image whitelist: a camera roll hands back HEIC,
// which is not an uploadable type but *is* an image, and the compressor transcodes it to JPEG rather
// than refusing it.
//
// Either claim is enough, because a picker that gets the type wrong usually gets it wrong in the
// generic direction: Android's document browser reports a photo as application/octet-stream, and
// treating that as a document would upload a multi-MB original uncompressed — straight into the 5MB
// refusal that the image path exists to avoid.
export function isImagePick(file: { mimeType?: string; fileName?: string | null }): boolean {
  return file.mimeType?.startsWith('image/') === true || isImageKey(file.fileName ?? '')
}

// How long a marker's display name may be. Marker text is what the composer, the bubble and the
// agent's Attachments list all read, so it stays short enough to sit in a chip.
const NAME_MAX = 24

// A file's name, trimmed of the characters that would break the marker's `[name](scheme:token)`
// shape and shortened to fit a chip. The extension survives the shortening: for a document it is
// the only thing that says what kind of file this is, to a reader and to an agent alike.
export function attachmentDisplayName(fileName?: string | null, fallback = 'file'): string {
  const clean = fileName?.replace(/[[\]()\n]/g, '').trim() || fallback
  if (clean.length <= NAME_MAX) return clean
  const dot = clean.lastIndexOf('.')
  const ext = dot > 0 && clean.length - dot <= 6 ? clean.slice(dot) : ''
  return clean.slice(0, NAME_MAX - ext.length) + ext
}
