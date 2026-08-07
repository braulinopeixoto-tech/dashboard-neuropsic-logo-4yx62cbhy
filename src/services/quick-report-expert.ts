import pb from '@/lib/pocketbase/client'

export type ExpertCitation = {
  n: number
  chunk_id: string
  source_id: string
  distance: number
  excerpt: string
}

export type ExpertQuickReportResult = {
  runtimeStatus: 'READY_FOR_HUMAN_REVIEW' | 'REPAIR_REQUIRED'
  reportMarkdown: string
  sections: Array<{
    sectionId: string
    title: string
    markdown: string
    evidenceClass: string
  }>
  claims: Array<{
    claimId: string
    text: string
    kind: 'FACT' | 'CLINICAL_INFERENCE' | 'PRUDENT_HYPOTHESIS' | 'RECOMMENDATION'
    supportingFacts: string[]
    contraryEvidence: string[]
    limitations: string[]
    critical: boolean
  }>
  attentionCards: Array<{
    cardId: string
    problem: string
    whyItMatters: string
    source: string
    proposal: string
    action: string
  }>
  limitations: string[]
  evidenceQualification: string
  memoryInfluence: Array<{ sectionId: string; citationNumbers: number[] }>
  critic: {
    status: 'PASS' | 'REPAIR_REQUIRED'
    safeForHumanReview: boolean
    factualFidelity: number
    unsupportedClaims: string[]
    missingCriticalFacts: string[]
    alteredMeasurements: string[]
    findings: Array<{ code: string; severity: string; message: string }>
    limitations: string[]
  }
  trust: {
    evidenceManifestId: string
    sourceHash: string
    outputHash: string
    runtime: 'skip-cloud-agent'
    modelAlias: 'reasoning'
    expertAgent: string
    criticAgent: string
    promptVersion: string
    expertMessageId: string
    criticMessageId: string
    expertConversationId: string
    criticConversationId: string
    expertCitations: ExpertCitation[]
    criticCitations: ExpertCitation[]
    generatedAt: string
  }
}

export async function generateExpertQuickReport(input: {
  rawNarrative: string
  profile: string
  purpose: string
  structuredFacts: unknown
  deterministicReport: string
}): Promise<ExpertQuickReportResult> {
  return pb.send('/backend/v1/quick-report/expert-generate', {
    method: 'POST',
    body: input,
  })
}
