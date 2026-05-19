export type EvidenceSource = 'Neurosynth' | 'NeuroQuery' | 'NiMARE' | 'InternalMap'

export type EvidenceQueryType = 'coordinate' | 'region' | 'function' | 'network' | 'term'

export type EvidenceWeight = 'low' | 'moderate' | 'high' | 'uncertain'

export type MetaAnalyticEvidence = {
  source: EvidenceSource
  queryType: EvidenceQueryType
  query: string
  associatedTerms: string[]
  associatedFunctions: string[]
  relatedNetworks: string[]
  evidenceWeight: EvidenceWeight
  confidence: number
  limitations: string[]
  references?: string[]
}
