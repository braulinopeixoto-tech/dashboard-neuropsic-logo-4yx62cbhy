import type { NeurofunctionalContext, SourceLocalizationMarker } from '../types'
import type { EvidenceQueryType, EvidenceWeight, MetaAnalyticEvidence } from './evidence-types'

const BASE_LIMITATION =
  'Evidencia meta-analitica offline baseada em mapa interno; nao diagnostica paciente, nao afirma causalidade e requer correlacao clinica.'

const COORDINATE_ONLY_LIMITATION =
  'Coordenada isolada exige anotacao anatomica por atlas validado antes de associacao meta-analitica.'

const DIVERGENCE_LIMITATION =
  'Ha divergencia ou baixa convergencia entre sinais clinicos/funcoes mapeadas e localizacao de fonte; peso meta-analitico reduzido.'

type EvidenceRule = {
  keys: string[]
  brodmannAreas: string[]
  associatedTerms: string[]
  associatedFunctions: string[]
  relatedNetworks: string[]
  references?: string[]
}

const EVIDENCE_RULES: EvidenceRule[] = [
  {
    keys: ['pre-frontal dorsolateral', 'prefrontal dorsolateral', 'dlpfc', 'executive'],
    brodmannAreas: ['BA9', 'BA46'],
    associatedTerms: ['executive function', 'working memory', 'cognitive control', 'response inhibition'],
    associatedFunctions: ['memoria operacional', 'planejamento', 'controle inibitorio', 'flexibilidade cognitiva'],
    relatedNetworks: ['Central Executive Network', 'Frontoparietal Control Network'],
    references: ['InternalMap:DLPFC-BA9-BA46'],
  },
  {
    keys: ['cingulado anterior', 'anterior cingulate', 'acc', 'salience'],
    brodmannAreas: ['BA24', 'BA32'],
    associatedTerms: ['error monitoring', 'conflict monitoring', 'salience', 'emotion regulation'],
    associatedFunctions: ['monitoramento de erro', 'motivacao', 'controle emocional', 'selecao de resposta'],
    relatedNetworks: ['Salience Network', 'Cingulo-opercular Network'],
    references: ['InternalMap:ACC-BA24-BA32'],
  },
  {
    keys: ['insula', 'insular'],
    brodmannAreas: [],
    associatedTerms: ['interoception', 'salience', 'autonomic integration', 'emotion'],
    associatedFunctions: ['interocepcao', 'saliencia emocional', 'percepcao corporal', 'integracao autonomica'],
    relatedNetworks: ['Salience Network'],
    references: ['InternalMap:Insula'],
  },
  {
    keys: ['precuneus', 'pcc', 'cingulado posterior', 'posterior cingulate', 'default mode'],
    brodmannAreas: ['BA7', 'BA31'],
    associatedTerms: ['default mode', 'self reference', 'autobiographical memory', 'internal mentation'],
    associatedFunctions: ['autorreferencia', 'memoria autobiografica', 'integracao interna', 'consciencia narrativa'],
    relatedNetworks: ['Default Mode Network'],
    references: ['InternalMap:Precuneus-PCC-BA7-BA31'],
  },
  {
    keys: ['temporal superior', 'superior temporal', 'language', 'auditory'],
    brodmannAreas: ['BA22'],
    associatedTerms: ['language comprehension', 'auditory processing', 'social cognition'],
    associatedFunctions: ['linguagem receptiva', 'processamento auditivo', 'cognicao social'],
    relatedNetworks: ['Language Network', 'Auditory Network', 'Social Processes Network'],
    references: ['InternalMap:SuperiorTemporal-BA22'],
  },
  {
    keys: ['parietal inferior', 'inferior parietal'],
    brodmannAreas: ['BA39', 'BA40'],
    associatedTerms: ['multimodal integration', 'reading', 'calculation', 'attention'],
    associatedFunctions: ['integracao multimodal', 'leitura', 'calculo', 'atencao', 'linguagem'],
    relatedNetworks: ['Default Mode Network', 'Language Network', 'Frontoparietal Control Network'],
    references: ['InternalMap:InferiorParietal-BA39-BA40'],
  },
  {
    keys: ['occipital', 'visual'],
    brodmannAreas: ['BA17', 'BA18', 'BA19'],
    associatedTerms: ['visual processing', 'visuospatial integration'],
    associatedFunctions: ['processamento visual primario/secundario', 'integracao visuoespacial'],
    relatedNetworks: ['Visual Network'],
    references: ['InternalMap:Occipital-BA17-BA18-BA19'],
  },
  {
    keys: ['sensorio-motor', 'sensoriomotor', 'sensorimotor', 'motor', 'somatossensorial'],
    brodmannAreas: ['BA1', 'BA2', 'BA3', 'BA4', 'BA6'],
    associatedTerms: ['motor control', 'somatosensory integration', 'motor planning'],
    associatedFunctions: ['controle motor', 'integracao somatossensorial', 'planejamento motor'],
    relatedNetworks: ['Sensorimotor Network'],
    references: ['InternalMap:Sensorimotor-BA1-BA2-BA3-BA4-BA6'],
  },
]

function uniq<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))]
}

function normalizeText(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeBrodmann(value?: string): string | undefined {
  if (!value) return undefined
  const match = value.toUpperCase().match(/BA\s*\d+/)
  return match ? match[0].replace(/\s+/g, '') : value.trim()
}

function markerQuery(marker: SourceLocalizationMarker): { queryType: EvidenceQueryType; query: string } {
  if (marker.region) return { queryType: 'region', query: marker.region }
  if (marker.brodmannArea) return { queryType: 'region', query: marker.brodmannArea }
  if (marker.probableFunction?.length) return { queryType: 'function', query: marker.probableFunction.join(', ') }
  if (marker.probableNetwork?.length) return { queryType: 'network', query: marker.probableNetwork.join(', ') }
  if (marker.coordinate) {
    return {
      queryType: 'coordinate',
      query: `${marker.coordinate.system}: x=${marker.coordinate.x}, y=${marker.coordinate.y}, z=${marker.coordinate.z}`,
    }
  }
  return { queryType: 'term', query: 'source localization sem descritor anatomico' }
}

function findRule(marker: SourceLocalizationMarker): EvidenceRule | undefined {
  const region = normalizeText(marker.region)
  const brodmannArea = normalizeBrodmann(marker.brodmannArea)
  const functions = (marker.probableFunction || []).map(normalizeText)
  const networks = (marker.probableNetwork || []).map(normalizeText)

  return EVIDENCE_RULES.find((rule) => {
    const regionMatch = region && rule.keys.some((key) => region.includes(normalizeText(key)))
    const baMatch = brodmannArea && rule.brodmannAreas.includes(brodmannArea)
    const functionMatch = functions.some((fn) => rule.associatedFunctions.map(normalizeText).includes(fn))
    const networkMatch = networks.some((network) => rule.relatedNetworks.map(normalizeText).includes(network))
    return regionMatch || baMatch || functionMatch || networkMatch
  })
}

function hasClinicalConvergence(context: NeurofunctionalContext, marker: SourceLocalizationMarker, rule?: EvidenceRule): boolean {
  const clinicalFunctions = context.functionalMappings.map((item) => normalizeText(item.functionName))
  const clinicalText = normalizeText(context.input.allFindings.join(' '))
  const sourceFunctions = [...(marker.probableFunction || []), ...(rule?.associatedFunctions || [])].map(normalizeText)
  if (!clinicalFunctions.length && !clinicalText) return true
  if (!sourceFunctions.length) return true

  return sourceFunctions.some((fn) => clinicalFunctions.includes(fn) || clinicalText.includes(fn))
}

function inferWeight(marker: SourceLocalizationMarker, rule: EvidenceRule | undefined, convergent: boolean): EvidenceWeight {
  if (marker.coordinate && !marker.region && !marker.brodmannArea) return 'uncertain'
  if (!rule || !convergent) return 'uncertain'
  if (marker.region && marker.brodmannArea && marker.probableFunction?.length) return 'high'
  if ((marker.region || marker.brodmannArea) && marker.probableFunction?.length) return 'moderate'
  return 'low'
}

function confidenceFor(weight: EvidenceWeight): number {
  if (weight === 'high') return 0.8
  if (weight === 'moderate') return 0.65
  if (weight === 'low') return 0.45
  return 0.25
}

function buildEvidence(context: NeurofunctionalContext, marker: SourceLocalizationMarker): MetaAnalyticEvidence {
  const rule = findRule(marker)
  const convergent = hasClinicalConvergence(context, marker, rule)
  const evidenceWeight = inferWeight(marker, rule, convergent)
  const query = markerQuery(marker)
  const limitations = [BASE_LIMITATION, ...marker.limitations]

  if (marker.coordinate && !marker.region && !marker.brodmannArea) {
    limitations.push(COORDINATE_ONLY_LIMITATION)
  }

  if (!convergent) {
    limitations.push(DIVERGENCE_LIMITATION)
  }

  if (!rule) {
    limitations.push('Mapa interno ainda nao possui associacao meta-analitica para este descritor.')
  }

  return {
    source: 'InternalMap',
    queryType: query.queryType,
    query: query.query,
    associatedTerms: rule?.associatedTerms || [],
    associatedFunctions: uniq([...(marker.probableFunction || []), ...(rule?.associatedFunctions || [])]),
    relatedNetworks: uniq([...(marker.probableNetwork || []), ...(rule?.relatedNetworks || [])]),
    evidenceWeight,
    confidence: confidenceFor(evidenceWeight),
    limitations: uniq(limitations),
    references: rule?.references,
  }
}

export function generateMetaAnalyticEvidence(context: NeurofunctionalContext): MetaAnalyticEvidence[] {
  return context.sourceLocalizationMarkers.map((marker) => buildEvidence(context, marker))
}
