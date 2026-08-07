import pb from '@/lib/pocketbase/client'
import {
  CANONICAL_REPORT_SCHEMA_VERSION,
  canonicalize,
  sha256Hex,
  type ClinicalContextSnapshot,
} from '@/features/clinical-records/canonical-contract'
import type { QuickReportInput, QuickReportOutput } from '@/quick-report'
import type { ReportProfile } from '@/quick-report/profiles/profile-types'

export type CanonicalQuickReportCommitInput = {
  patientId: string
  title: string
  profile: ReportProfile
  reportMarkdown: string
  parsedInput: QuickReportInput
  report: QuickReportOutput
  contextSnapshot: ClinicalContextSnapshot
  submissionKey: string
}

export type CanonicalQuickReportCommitResult = {
  reportId: string
  auditEventId: string
  version: number
  status: 'CANONICAL_COMMITTED'
  sourceFingerprint: string
  reportFingerprint: string
  idempotent: boolean
}

export async function commitCanonicalQuickReport(
  input: CanonicalQuickReportCommitInput,
): Promise<CanonicalQuickReportCommitResult> {
  const sourceCanonical = canonicalize(input.parsedInput)
  const sourceFingerprint = await sha256Hex(sourceCanonical)
  const reportFingerprint = await sha256Hex(
    canonicalize({
      sourceFingerprint,
      reportMarkdown: input.reportMarkdown,
      engineVersion: input.report.auditTrace.engineVersion,
      profile: input.profile,
      schemaVersion: CANONICAL_REPORT_SCHEMA_VERSION,
    }),
  )

  return pb.send('/backend/v1/quick-reports/commit', {
    method: 'POST',
    body: {
      pacienteId: input.patientId,
      titulo: input.title.trim(),
      profile: input.profile,
      conteudo: input.reportMarkdown,
      sourceCanonical,
      sourceFingerprint,
      reportFingerprint,
      engineVersion: input.report.auditTrace.engineVersion,
      provenance: {
        schemaVersion: CANONICAL_REPORT_SCHEMA_VERSION,
        sourceIds: input.contextSnapshot.sourceIds,
        sources: input.contextSnapshot.sources,
        limitations: [...input.contextSnapshot.limitations, ...input.report.auditTrace.limitations],
        safetyGuardPassed: input.report.auditTrace.safetyGuardPassed,
      },
      contextSnapshot: input.contextSnapshot,
      reviewDecision: 'APPROVED',
      submissionKey: input.submissionKey,
    },
  })
}
