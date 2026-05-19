export type RequestedPurpose =
  | 'screening'
  | 'diagnostic_referral'
  | 'evolution_report'
  | 'legal_social_benefit'
  | 'clinical_summary'

export type BrainEnergy = 'hypoactive' | 'hyperactive' | 'unstable' | 'mixed'
export type NetworkIntegration = 'coupled' | 'decoupled' | 'overcoupled' | 'fragmented'
export type Organization = 'coherent' | 'diffuse' | 'rigid' | 'noisy'
export type RiskLevel = 'low' | 'moderate' | 'high'

export type NqlBlockType =
  | 'PatientContext'
  | 'ClinicalSignal'
  | 'DevelopmentalMarker'
  | 'PsychometricFinding'
  | 'QEEGMarker'
  | 'SourceLocalization'
  | 'NetworkState'
  | 'RDoCDomain'
  | 'FunctionalHypothesis'
  | 'RiskVector'
  | 'InterventionPhase'
  | 'AuditTrace'

export type QuickReportInput = {
  patient: {
    name: string
    age?: string
    birthDate?: string
    school?: string
    guardian?: string
  }
  complaint: string[]
  developmentalHistory?: string[]
  clinicalHistory?: string[]
  schoolHistory?: string[]
  behavioralFindings?: string[]
  psychometricFindings?: string[]
  qeeg?: {
    findings: string[]
    bands?: string[]
    frequencyHz?: number[]
    location10_20?: string[]
    amplitude?: string[]
    interpretation?: string
  }
  sourceLocalization?: {
    method?: 'sLORETA' | 'eLORETA' | 'other'
    coordinates?: {
      system: 'MNI' | 'Talairach'
      x: number
      y: number
      z: number
    }[]
    regions?: string[]
    brodmannAreas?: string[]
  }
  requestedPurpose: RequestedPurpose
  flags?: {
    avoidTerms?: string[]
    requireMedicalReferral?: boolean
    juridicalSensitivity?: boolean
  }
}

export type NeurofunctionalState = {
  brainEnergy: BrainEnergy
  networkIntegration: NetworkIntegration
  organization: Organization
}

export type ClinicalSignal = {
  source: keyof QuickReportInput | 'qeeg' | 'sourceLocalization'
  finding: string
  interpretation: string
  confidenceImpact: number
}

export type DomainMapping = {
  rdocDomains: string[]
  networks: string[]
  cognitiveFunctions: string[]
}

export type FunctionalHypothesis = {
  finding: string
  interpretation: string
  hypothesis: string
  recommendation: string
}

export type AuditTrace = {
  inputHash: string
  generatedAt: string
  engineVersion: string
  confidenceLevel: number
  fieldsUsed: string[]
  fieldsMissing: string[]
  limitations: string[]
  riskAlerts: string[]
  inferenceTrace: string[]
}

export type InterventionPlan = {
  phase1: string[]
  phase2: string[]
  phase3: string[]
}

export type QuickReportOutput = {
  reportMarkdown: string
  structuredFindings: {
    nqlBlocks: Partial<Record<NqlBlockType, unknown[]>>
    clinicalSignals: ClinicalSignal[]
    domainMapping: DomainMapping
    functionalHypotheses: FunctionalHypothesis[]
  }
  neurofunctionalState: NeurofunctionalState
  dominantHypothesis: string
  differentialHypotheses: string[]
  riskLevel: RiskLevel
  interventionPlan: InterventionPlan
  auditTrace: AuditTrace
}

export type NormalizedQuickReportInput = QuickReportInput & {
  normalizedAt: string
  allFindings: string[]
}
