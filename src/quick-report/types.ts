import type { MetaAnalyticEvidence } from './evidence/evidence-types'

export type RequestedPurpose =
  | 'screening'
  | 'diagnostic_referral'
  | 'evolution_report'
  | 'legal_social_benefit'
  | 'clinical_summary'

export type BrainEnergy = 'hypoactive' | 'hyperactive' | 'unstable' | 'mixed'
export type BrainEnergyImpact = BrainEnergy | 'uncertain'
export type NetworkIntegration = 'coupled' | 'decoupled' | 'overcoupled' | 'fragmented'
export type NetworkState = NetworkIntegration | 'uncertain'
export type Organization = 'coherent' | 'diffuse' | 'rigid' | 'noisy'
export type OrganizationImpact = Organization | 'uncertain'
export type RiskLevel = 'low' | 'moderate' | 'high'
export type CoordinateSystem = 'MNI' | 'Talairach'
export type ConfidenceTier = 'low' | 'moderate' | 'high' | 'insufficient'
export type SafetySeverity = 'info' | 'warning' | 'critical'

export type QuickReportOptions = {
  profile?: import('./profiles/profile-types').ReportProfile
}

export type BrainCoordinate = {
  system: CoordinateSystem
  x: number
  y: number
  z: number
}

export type ClinicalConfidenceScore = {
  score: number
  tier: ConfidenceTier
  convergenceDrivers: string[]
  divergenceDrivers: string[]
  missingData: string[]
  cautionFlags: string[]
  interpretation: string
  limitations: string[]
}

export type SafetyFinding = {
  severity: SafetySeverity
  code: string
  message: string
  suggestion?: string
}

export type SafetyGuardResult = {
  passed: boolean
  findings: SafetyFinding[]
  sanitizedMarkdown: string
  sanitizedTerms: string[]
  limitationsAdded: string[]
}

export type EEGLocation10_20 =
  | 'Fp1'
  | 'Fp2'
  | 'F3'
  | 'F4'
  | 'F7'
  | 'F8'
  | 'C3'
  | 'C4'
  | 'Cz'
  | 'P3'
  | 'P4'
  | 'Pz'
  | 'T3'
  | 'T4'
  | 'T5'
  | 'T6'
  | 'O1'
  | 'O2'
  | 'Fz'

export type EEGFrequencyBand =
  | 'delta'
  | 'theta'
  | 'alpha'
  | 'beta'
  | 'high_beta'
  | 'gamma'
  | 'unknown'

export type NqlBlockType =
  | 'PatientContext'
  | 'ClinicalSignal'
  | 'DevelopmentalMarker'
  | 'PsychometricFinding'
  | 'QEEGMarker'
  | 'SourceLocalization'
  | 'MetaAnalyticEvidence'
  | 'ClinicalConfidenceScore'
  | 'SafetyGuard'
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
    city?: string
  }
  complaint: string[]
  developmentalHistory?: string[]
  clinicalHistory?: string[]
  schoolHistory?: string[]
  behavioralFindings?: string[]
  psychometricFindings?: string[]
  recommendationsRaw?: string[]
  responsibleProfessional?: string
  documentPurpose?: string
  qeeg?: {
    findings: string[]
    bands?: string[]
    frequencyHz?: number[]
    location10_20?: string[]
    amplitude?: string[]
    interpretation?: string
  }
  sourceLocalization?: {
    method?: 'sLORETA' | 'eLORETA' | 'LORETA' | 'other'
    coordinates?: BrainCoordinate[]
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

export type QEEGMarker = {
  finding: string
  band?: string
  frequencyHz?: number
  location10_20?: string
  amplitude?: string
  interpretation?: string
}

export type QEEGStructuredMarker = {
  band: EEGFrequencyBand
  frequencyHz?: number
  location10_20?: EEGLocation10_20[]
  region?: string[]
  probableNetwork?: string[]
  probableFunction?: string[]
  energyImpact: BrainEnergyImpact
  organizationImpact: OrganizationImpact
  evidence: string[]
  confidence: number
  limitations: string[]
}

export type SourceLocalizationMarker = {
  method?: 'sLORETA' | 'eLORETA' | 'LORETA' | 'other'
  coordinate?: BrainCoordinate
  region?: string
  brodmannArea?: string
  hemisphere?: 'left' | 'right' | 'midline' | 'bilateral' | 'uncertain'
  probableNetwork?: string[]
  probableFunction?: string[]
  rdocDomain?: string[]
  energyImpact?: BrainEnergyImpact
  organizationImpact?: OrganizationImpact
  evidence: string[]
  confidence: number
  limitations: string[]
}

export type RDoCMapping = {
  domain: string
  construct?: string
  evidence: string[]
  confidence: number
}

export type NetworkMapping = {
  network: string
  state: NetworkState
  evidence: string[]
  confidence: number
}

export type FunctionalMapping = {
  functionName: string
  evidence: string[]
  confidence: number
}

export type DomainMapping = {
  rdocDomains: string[]
  networks: string[]
  cognitiveFunctions: string[]
  rdocMappings?: RDoCMapping[]
  networkMappings?: NetworkMapping[]
  functionalMappings?: FunctionalMapping[]
  qeegStructuredMarkers?: QEEGStructuredMarker[]
  sourceLocalizationMarkers?: SourceLocalizationMarker[]
  metaAnalyticEvidence?: MetaAnalyticEvidence[]
  clinicalConfidenceScore?: ClinicalConfidenceScore
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
  safetyGuardPassed: boolean
  safetyFindingsCount: number
  criticalFindingsCount: number
  sanitizedTerms: string[]
}

export type InterventionPlan = {
  phase1: string[]
  phase2: string[]
  phase3: string[]
}

export type RiskAssessment = {
  level: RiskLevel
  alerts: string[]
  evidence: string[]
  confidence: number
}

export type NeurofunctionalContext = {
  input: NormalizedQuickReportInput
  signals: ClinicalSignal[]
  qeegMarkers: QEEGMarker[]
  qeegStructuredMarkers: QEEGStructuredMarker[]
  sourceLocalizationMarkers: SourceLocalizationMarker[]
  metaAnalyticEvidence?: MetaAnalyticEvidence[]
  riskAssessment?: RiskAssessment
  interventionPlan?: InterventionPlan
  rdocMappings: RDoCMapping[]
  networkMappings: NetworkMapping[]
  functionalMappings: FunctionalMapping[]
  neurofunctionalState: NeurofunctionalState
}

export type QuickReportOutput = {
  reportMarkdown: string
  profile: import('./profiles/profile-types').ReportProfile
  structuredFindings: {
    nqlBlocks: Partial<Record<NqlBlockType, unknown[]>>
    clinicalSignals: ClinicalSignal[]
    domainMapping: DomainMapping
    functionalHypotheses: FunctionalHypothesis[]
    clinicalConfidenceScore: ClinicalConfidenceScore
    safetyGuard: SafetyGuardResult
  }
  neurofunctionalState: NeurofunctionalState
  dominantHypothesis: string
  differentialHypotheses: string[]
  riskLevel: RiskLevel
  interventionPlan: InterventionPlan
  clinicalConfidenceScore: ClinicalConfidenceScore
  safetyGuard: SafetyGuardResult
  auditTrace: AuditTrace
}

export type NormalizedQuickReportInput = QuickReportInput & {
  normalizedAt: string
  allFindings: string[]
}
