import { BUSY_PHASES, isAwaitingUser, isChiefConversationId, isPlanSideTodoPhase, isResettablePhase, type Build, type Todo, type TodoPhase } from '@tds/types'
import { recentRunAt } from './todoList'

// The team's open todos as the progress screen lists them and the sidebar counts them: parked on
// a person, broken, or running. An undispatched row (phase 'todo') and a settled one belong to
// neither — the project list is their home.
export interface ProgressGroups {
  pending: Todo[]
  failed: Todo[]
  running: Todo[]
}

const byRecentRun = (a: Todo, b: Todo): number => recentRunAt(b) - recentRunAt(a)

export function groupProgress(todos: readonly Todo[]): ProgressGroups {
  const groups: ProgressGroups = { pending: [], failed: [], running: [] }
  for (const todo of todos) {
    if (isAwaitingUser(todo.phase)) groups.pending.push(todo)
    else if (todo.phase === 'failed') groups.failed.push(todo)
    else if (todo.phase === 'queued' || BUSY_PHASES.includes(todo.phase)) groups.running.push(todo)
  }
  groups.pending.sort(byRecentRun)
  groups.failed.sort(byRecentRun)
  groups.running.sort(byRecentRun)
  return groups
}

// What the badges count: rows that wait on a person, not the ones an agent is still on.
export const needsYouCount = (groups: ProgressGroups): number => groups.pending.length + groups.failed.length

// The progress board's columns, left to right along the pipeline: the backlog, the agent's turn
// (plan or build step), the user's gate (a plan to confirm or changes to accept), then what
// landed. A column is a stage, its colour says who holds the ball (grey = nobody yet, blue = an
// agent, amber = the user, green = landed). A failure is not a stage of its own: the agent has
// stopped and the next move (retry, reset or complete) is the user's, so the card waits in the
// review column, flagged red. The phone's tabs are the same four buckets.
export const PROGRESS_COLUMNS = ['backlog', 'building', 'review', 'done'] as const
export type ProgressColumn = (typeof PROGRESS_COLUMNS)[number]

// The phase each column takes its dot colour from.
export const PROGRESS_COLUMN_PHASE: Record<ProgressColumn, TodoPhase> = {
  backlog: 'todo',
  building: 'building',
  review: 'review',
  done: 'done',
}

// Settled work stays on the board this long, then goes back to being the project list's alone.
export const PROGRESS_DONE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// GET /api/teams/[teamId]/progress: the board's rows, plus the builds whose docs decide where a
// gate-phase row sits and what its card offers — shipped together so the first paint is the final
// one rather than a re-bucket once each card has fetched its build.
export interface TeamProgressResponse {
  todos: Todo[]
  builds: Build[]
}

// The phases whose card depends on the build doc (confirm: a plan to confirm or a question to
// answer; review: the branch the card's download button opens).
export const BUILD_FACT_PHASES: ReadonlySet<TodoPhase> = new Set(['confirm', 'review'])

// The plan and build steps share one column, as do their gates. A review-phase todo sits at the
// gate whether or not its build changed code: a research or question task delivers its answer as
// the reply, and no agent is working on it any more — the user reads it and completes the todo.
export function progressColumnOf(
  todo: Pick<Todo, 'phase' | 'phaseAt' | 'updatedAt'>,
  now: number = Date.now(),
): ProgressColumn | null {
  const { phase } = todo
  if (phase === 'todo') return 'backlog'
  if (phase === 'confirm' || phase === 'review' || phase === 'failed') return 'review'
  if (isPlanSideTodoPhase(phase) || phase === 'building' || phase === 'implement_reviewing') return 'building'
  if (phase === 'done') return (todo.phaseAt ?? todo.updatedAt) >= now - PROGRESS_DONE_WINDOW_MS ? 'done' : null
  return null
}

export type ProgressColumns = Record<ProgressColumn, Todo[]>

// A column lists what an agent is on right now first, then the cards waiting on a person (both
// gates and failed builds alike), then the rest — newest run first within each.
const waitsOnUserPhase = (phase: TodoPhase) => phase === 'failed' || isAwaitingUser(phase)
const sortRank = (t: Todo): number => BUSY_PHASES.includes(t.phase) ? 0 : waitsOnUserPhase(t.phase) ? 1 : 2
const runningFirst = (a: Todo, b: Todo): number => sortRank(a) - sortRank(b) || byRecentRun(a, b)

export function groupProgressColumns(
  todos: readonly Todo[],
  now: number = Date.now(),
): ProgressColumns {
  const columns: ProgressColumns = { backlog: [], building: [], review: [], done: [] }
  for (const todo of todos) {
    const column = progressColumnOf(todo, now)
    if (column) columns[column].push(todo)
  }
  for (const column of PROGRESS_COLUMNS) columns[column].sort(runningFirst)
  return columns
}

// Who put a card on the board, as the viewer sees it. sourceBuildId marks every agent-made todo —
// the chief's id, `mcp:<keyId>`, or a build's follow-up — so it wins over createdBy, which for an
// MCP client is the human behind the key.
export type TodoCreatorKind = 'me' | 'agent' | 'others'
export const TODO_CREATOR_KINDS: readonly TodoCreatorKind[] = ['me', 'agent', 'others']

export function todoCreatorKind(todo: Todo, meId: string | null | undefined): TodoCreatorKind {
  if (todo.sourceBuildId) return 'agent'
  return meId && todo.createdBy === meId ? 'me' : 'others'
}

export function todoAgentSource(todo: Todo): 'chief' | 'agent' | null {
  if (!todo.sourceBuildId) return null
  return isChiefConversationId(todo.sourceBuildId) ? 'chief' : 'agent'
}

// What dropping a card on a column does. Only the moves that are the user's exist: starting a
// build, confirming a plan, completing, and resetting — back to the backlog, every build dropped,
// which is the one move a dispatched card (queued, the busy phases) can make. A done card reopens
// onto the column it was completed from, and one that has run can be reset like any other. Every
// pair not listed is not a drop target.
export type ProgressMove = 'start' | 'confirm' | 'complete' | 'reset' | 'reopen'

type Moves = Partial<Record<ProgressColumn, ProgressMove>>

// The phase uncomplete restores: the one the todo was completed from. A doc without it falls back
// as the server does — the review gate if it ever ran, un-started if not.
export const uncompleteTargetOf = (todo: Pick<Todo, 'prevPhase' | 'latestBuildId'>): TodoPhase =>
  todo.prevPhase ?? (todo.latestBuildId ? 'review' : 'todo')

function reopenMovesOf(todo: Pick<Todo, 'prevPhase' | 'latestBuildId'>): Moves {
  const target = uncompleteTargetOf(todo)
  if (target === 'todo') return { backlog: 'reopen' }
  return waitsOnUserPhase(target) ? { review: 'reopen' } : {}
}

function forwardMovesOf(phase: TodoPhase): Moves {
  switch (phase) {
    case 'todo':
    case 'failed':
      return { building: 'start', done: 'complete' }
    case 'confirm':
      return { building: 'confirm', done: 'complete' }
    case 'review':
      return { done: 'complete' }
    default:
      return {}
  }
}

export function progressMovesOf(todo: Pick<Todo, 'phase' | 'prevPhase' | 'latestBuildId'>): Moves {
  const { phase } = todo
  // A done card never run reopens onto the backlog, which outranks the reset there.
  const forward = phase === 'done' ? reopenMovesOf(todo) : forwardMovesOf(phase)
  return isResettablePhase(phase) ? { backlog: 'reset', ...forward } : forward
}
