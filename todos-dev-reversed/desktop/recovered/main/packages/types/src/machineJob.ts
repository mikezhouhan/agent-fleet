import type { MachineStep } from './index'
import type { BranchSyncClaim } from './branchSync'

export const MACHINE_JOB_LOCK_MS = 3 * 60 * 1000

export interface BranchSyncJob {
  mode: 'branch_sync'
  stepId: string
  requestId: string
  teamId: string
  machineId: string
  // Enriched only in the claim response; never put Git credentials in the queue.
  claim?: BranchSyncClaim
}

export type MachineJob = MachineStep | BranchSyncJob
export const isBranchSyncJob = (job: MachineJob): job is BranchSyncJob => job.mode === 'branch_sync'
export const branchSyncStepId = (requestId: string): string => `branch-sync-${requestId}`
export const branchSyncRequestId = (stepId: string): string | null => /^branch-sync-([a-zA-Z0-9_-]{8,100})$/.exec(stepId)?.[1] ?? null
