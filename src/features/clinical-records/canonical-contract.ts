export const CANONICAL_REPORT_SCHEMA_VERSION = 'NS-CR-1.0'

export type CanonicalReportStatus =
  | 'DRAFT'
  | 'HUMAN_REVIEW_PENDING'
  | 'HUMAN_APPROVED'
  | 'CANONICAL_COMMITTED'
  | 'FAILED'

export type HumanReviewDecision = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ClinicalContextSource = {
  collection: string
  recordIds: string[]
  count: number
}

export type ClinicalContextSnapshot = {
  patientId: string
  assembledAt: string
  sourceIds: string[]
  sources: ClinicalContextSource[]
  limitations: string[]
}

export type CanonicalCommitReadinessInput = {
  patientId?: string
  title?: string
  hasGeneratedReport: boolean
  humanReviewDecision: HumanReviewDecision
  hasClinicalContext: boolean
  exceedsContentLimit: boolean
  truncationAccepted: boolean
}

export type CanonicalCommitReadiness = {
  ready: boolean
  blockers: string[]
}

export function canonicalize(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
    .join(',')}}`
}

export async function sha256Hex(content: string): Promise<string> {
  const bytes = new TextEncoder().encode(content)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function getCanonicalCommitReadiness(
  input: CanonicalCommitReadinessInput,
): CanonicalCommitReadiness {
  const blockers: string[] = []

  if (!input.patientId) blockers.push('Selecione um paciente cadastrado.')
  if (!input.title?.trim()) blockers.push('Informe o título do relatório.')
  if (!input.hasGeneratedReport) blockers.push('Gere o preview clínico.')
  if (!input.hasClinicalContext) {
    blockers.push('Carregue o contexto longitudinal do prontuário NeuroStrata.')
  }
  if (input.humanReviewDecision !== 'APPROVED') {
    blockers.push('A revisão profissional precisa aprovar o preview.')
  }
  if (input.exceedsContentLimit && !input.truncationAccepted) {
    blockers.push('Autorize o truncamento metodológico ou reduza o relatório.')
  }

  return {
    ready: blockers.length === 0,
    blockers,
  }
}

export function createSubmissionKey(prefix: 'patient' | 'report'): string {
  return `${prefix}-${crypto.randomUUID()}`
}
