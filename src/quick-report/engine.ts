import { generateAuditTrace } from './audit'
import { generateMetaAnalyticEvidence } from './evidence'
import {
  calculateFunctionalRisk,
  generateInterventionPhases,
  mapClinicalSignalsToRDoC,
  mapQEEGMarkers,
  mapSignalsToFunctions,
  mapSignalsToNetworks,
  mapSourceLocalization,
} from './maps'
import { renderReport } from './renderers/markdown-renderer'
import { calculateClinicalConfidenceScore } from './scoring'
import type {
  BrainEnergy,
  ClinicalSignal,
  DomainMapping,
  FunctionalHypothesis,
  NetworkIntegration,
  NeurofunctionalContext,
  NormalizedQuickReportInput,
  Organization,
  QEEGMarker,
  QEEGStructuredMarker,
  QuickReportInput,
  QuickReportOutput,
  SourceLocalizationMarker,
} from './types'

const HYPERAROUSAL_TERMS = ['ansiedade', 'agitação', 'irritabilidade', 'insônia', 'hiperatividade', 'impulsividade']
const HYPOACTIVE_TERMS = ['lentificacao', 'lentidão', 'fadiga', 'apatia', 'sonolencia', 'sonolência', 'baixo engajamento']
const INSTABILITY_TERMS = ['oscilacao', 'oscilação', 'instabilidade', 'variabilidade', 'desregulacao', 'desregulação']

function compactList(items?: string[]): string[] {
  return (items || []).map((item) => item.trim()).filter(Boolean)
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0)
}

function uniq(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

export function normalizeInput(input: QuickReportInput): NormalizedQuickReportInput {
  const normalized: NormalizedQuickReportInput = {
    ...input,
    complaint: compactList(input.complaint),
    developmentalHistory: compactList(input.developmentalHistory),
    clinicalHistory: compactList(input.clinicalHistory),
    schoolHistory: compactList(input.schoolHistory),
    behavioralFindings: compactList(input.behavioralFindings),
    psychometricFindings: compactList(input.psychometricFindings),
    qeeg: input.qeeg
      ? {
          ...input.qeeg,
          findings: compactList(input.qeeg.findings),
          bands: compactList(input.qeeg.bands),
          location10_20: compactList(input.qeeg.location10_20),
          amplitude: compactList(input.qeeg.amplitude),
        }
      : undefined,
    sourceLocalization: input.sourceLocalization
      ? {
          ...input.sourceLocalization,
          regions: compactList(input.sourceLocalization.regions),
          brodmannAreas: compactList(input.sourceLocalization.brodmannAreas),
        }
      : undefined,
    normalizedAt: new Date().toISOString(),
    allFindings: [],
  }

  normalized.allFindings = [
    ...normalized.complaint,
    ...(normalized.developmentalHistory || []),
    ...(normalized.clinicalHistory || []),
    ...(normalized.schoolHistory || []),
    ...(normalized.behavioralFindings || []),
    ...(normalized.psychometricFindings || []),
    ...(normalized.qeeg?.findings || []),
    ...(normalized.qeeg?.bands || []),
    ...(normalized.qeeg?.amplitude || []),
    ...(normalized.sourceLocalization?.regions || []),
    ...(normalized.sourceLocalization?.brodmannAreas || []),
  ]

  return normalized
}

export function extractClinicalSignals(input: NormalizedQuickReportInput): ClinicalSignal[] {
  const signals: ClinicalSignal[] = []
  const addSignals = (
    source: ClinicalSignal['source'],
    findings?: string[],
    interpretation = 'Achado clinico relevante para convergencia funcional.',
  ) => {
    findings?.forEach((finding) => {
      signals.push({ source, finding, interpretation, confidenceImpact: 0.05 })
    })
  }

  addSignals('complaint', input.complaint, 'Queixa principal orienta a primeira camada de convergencia sem definir diagnostico isolado.')
  addSignals('developmentalHistory', input.developmentalHistory, 'Marcador do desenvolvimento pode modular a hipotese neurofuncional.')
  addSignals('clinicalHistory', input.clinicalHistory, 'Historico clinico amplia contexto e risco funcional.')
  addSignals('schoolHistory', input.schoolHistory, 'Historico escolar contribui para estimar impacto adaptativo.')
  addSignals('behavioralFindings', input.behavioralFindings, 'Achado comportamental sugere expressao funcional observavel.')
  addSignals('psychometricFindings', input.psychometricFindings, 'Achado psicometrico aumenta confianca quando correlacionado a clinica.')
  addSignals('qeeg', input.qeeg?.findings, 'Achado qEEG fortalece convergencia neurofuncional quando presente.')
  addSignals('sourceLocalization', input.sourceLocalization?.regions, 'Localizacao de fonte sugere rede/regiao provavel, exigindo correlacao clinica.')
  addSignals('sourceLocalization', input.sourceLocalization?.brodmannAreas, 'Area de Brodmann informada sustenta inferencia funcional aproximada, sem causalidade isolada.')

  return signals
}

export function extractQeegMarkers(input: NormalizedQuickReportInput): QEEGMarker[] {
  return (input.qeeg?.findings || []).map((finding, index) => ({
    finding,
    band: input.qeeg?.bands?.[index],
    frequencyHz: input.qeeg?.frequencyHz?.[index],
    location10_20: input.qeeg?.location10_20?.[index],
    amplitude: input.qeeg?.amplitude?.[index],
    interpretation: input.qeeg?.interpretation,
  }))
}

export function mapToDomains(
  context: Pick<NeurofunctionalContext, 'signals' | 'qeegMarkers' | 'qeegStructuredMarkers' | 'sourceLocalizationMarkers'>,
): DomainMapping {
  const rdocMappings = mapClinicalSignalsToRDoC(context.signals)
  const networkMappings = mapSignalsToNetworks(context.signals, context.qeegMarkers)
  const functionalMappings = mapSignalsToFunctions(context.signals)
  const qeegNetworks = context.qeegStructuredMarkers.flatMap((marker) => marker.probableNetwork || [])
  const qeegFunctions = context.qeegStructuredMarkers.flatMap((marker) => marker.probableFunction || [])
  const sourceNetworks = context.sourceLocalizationMarkers.flatMap((marker) => marker.probableNetwork || [])
  const sourceFunctions = context.sourceLocalizationMarkers.flatMap((marker) => marker.probableFunction || [])
  const sourceRDoC = context.sourceLocalizationMarkers.flatMap((marker) => marker.rdocDomain || [])

  return {
    rdocDomains: uniq([...rdocMappings.map((item) => item.domain), ...sourceRDoC]),
    networks: uniq([...networkMappings.map((item) => item.network), ...qeegNetworks, ...sourceNetworks]),
    cognitiveFunctions: uniq([...functionalMappings.map((item) => item.functionName), ...qeegFunctions, ...sourceFunctions]),
    rdocMappings,
    networkMappings,
    functionalMappings,
    qeegStructuredMarkers: context.qeegStructuredMarkers,
    sourceLocalizationMarkers: context.sourceLocalizationMarkers,
  }
}

export function classifyNeurofunctionalState(
  input: NormalizedQuickReportInput,
  qeegStructuredMarkers: QEEGStructuredMarker[] = [],
  sourceLocalizationMarkers: SourceLocalizationMarker[] = [],
): QuickReportOutput['neurofunctionalState'] {
  const text = input.allFindings.join(' ').toLowerCase()
  const hyperScore = countMatches(text, HYPERAROUSAL_TERMS)
  const hypoScore = countMatches(text, HYPOACTIVE_TERMS)
  const instabilityScore = countMatches(text, INSTABILITY_TERMS)

  let brainEnergy: BrainEnergy = 'mixed'
  if (instabilityScore > 0) brainEnergy = 'unstable'
  else if (hyperScore > hypoScore) brainEnergy = 'hyperactive'
  else if (hypoScore > hyperScore) brainEnergy = 'hypoactive'

  const qEEGEnergy = qeegStructuredMarkers.find((marker) => marker.energyImpact !== 'uncertain')?.energyImpact
  const sourceEnergy = sourceLocalizationMarkers.find((marker) => marker.energyImpact && marker.energyImpact !== 'uncertain')?.energyImpact
  if (qEEGEnergy && qEEGEnergy !== 'uncertain') brainEnergy = qEEGEnergy
  else if (sourceEnergy && sourceEnergy !== 'uncertain') brainEnergy = sourceEnergy

  let networkIntegration: NetworkIntegration = 'coupled'
  if (includesAny(text, ['fragmentacao', 'fragmentação', 'desorganizacao', 'desorganização'])) networkIntegration = 'fragmented'
  else if (includesAny(text, ['desacoplamento', 'isolamento funcional'])) networkIntegration = 'decoupled'
  else if (includesAny(text, ['hiperconectividade', 'hiperacoplamento', 'rigidez de rede'])) networkIntegration = 'overcoupled'
  else if (qeegStructuredMarkers.some((marker) => marker.probableNetwork?.length) || sourceLocalizationMarkers.some((marker) => marker.probableNetwork?.length)) networkIntegration = 'decoupled'

  let organization: Organization = 'coherent'
  if (includesAny(text, ['ruido', 'ruído', 'artefato', 'instavel', 'instável'])) organization = 'noisy'
  else if (includesAny(text, ['rigidez', 'perseveracao', 'perseveração'])) organization = 'rigid'
  else if (includesAny(text, ['difuso', 'desorganizado', 'desorganizacao', 'desorganização'])) organization = 'diffuse'

  const qEEGOrganization = qeegStructuredMarkers.find((marker) => marker.organizationImpact !== 'uncertain')?.organizationImpact
  const sourceOrganization = sourceLocalizationMarkers.find((marker) => marker.organizationImpact && marker.organizationImpact !== 'uncertain')?.organizationImpact
  if (qEEGOrganization && qEEGOrganization !== 'uncertain') organization = qEEGOrganization
  else if (sourceOrganization && sourceOrganization !== 'uncertain') organization = sourceOrganization

  return { brainEnergy, networkIntegration, organization }
}

export function generateHypotheses(params: {
  input: NormalizedQuickReportInput
  domains: DomainMapping
  state: QuickReportOutput['neurofunctionalState']
}): {
  dominantHypothesis: string
  differentialHypotheses: string[]
  functionalHypotheses: FunctionalHypothesis[]
} {
  const domains = params.domains.rdocDomains.join(', ') || 'dominios ainda pouco especificados'
  const networks = params.domains.networks.join(', ') || 'redes funcionais nao especificadas'
  const functions = params.domains.cognitiveFunctions.join(', ') || 'funcoes cognitivas/emocionais ainda pouco especificadas'

  const dominantHypothesis = `Os achados sugerem uma hipotese dimensional de disfuncao neurofuncional envolvendo ${domains}, com participacao provavel de ${networks} e impacto em ${functions}. Achados de localizacao de fonte, evidencia meta-analitica e grau de convergencia clinica, quando presentes, representam sustentacao funcional aproximada e necessitam correlacao clinica e complementar.`

  const differentialHypotheses = [
    'Perfil atencional/executivo secundario a desregulacao emocional ou sono insuficiente.',
    'Padrao funcional influenciado por contexto escolar, familiar ou adaptativo.',
    'Condicao neurodesenvolvimental ou clinica que requer investigacao complementar sem conclusao nosologica nesta etapa.',
  ]

  const functionalHypotheses: FunctionalHypothesis[] = params.input.allFindings.slice(0, 8).map((finding) => ({
    finding,
    interpretation: 'Achado considerado dentro de cadeia de convergencia, sem conclusao por sintoma isolado.',
    hypothesis: dominantHypothesis,
    recommendation: 'Recomenda-se correlacao com entrevista, medidas padronizadas e observacao funcional.',
  }))

  if (functionalHypotheses.length === 0) {
    functionalHypotheses.push({
      finding: 'Dados clinicos insuficientes.',
      interpretation: 'A baixa densidade de dados limita inferencias neurofuncionais.',
      hypothesis: 'Hipotese dimensional ainda indeterminada.',
      recommendation: 'Ampliar anamnese, instrumentos e registros funcionais antes de conclusoes.',
    })
  }

  return { dominantHypothesis, differentialHypotheses, functionalHypotheses }
}

export function calculateConfidence(input: NormalizedQuickReportInput): number {
  const availableSignals = [
    input.complaint.length > 0,
    Boolean(input.developmentalHistory?.length),
    Boolean(input.clinicalHistory?.length),
    Boolean(input.schoolHistory?.length),
    Boolean(input.behavioralFindings?.length),
    Boolean(input.psychometricFindings?.length),
    Boolean(input.qeeg?.findings?.length),
    Boolean(input.sourceLocalization?.regions?.length || input.sourceLocalization?.brodmannAreas?.length || input.sourceLocalization?.coordinates?.length),
  ].filter(Boolean).length

  return Math.min(0.95, Math.max(0.15, availableSignals / 8))
}

export function generateQuickReport(input: QuickReportInput): QuickReportOutput {
  const normalized = normalizeInput(input)
  const clinicalSignals = extractClinicalSignals(normalized)
  const qeegMarkers = extractQeegMarkers(normalized)
  const qeegStructuredMarkers = mapQEEGMarkers(qeegMarkers)
  const sourceLocalizationMarkers = mapSourceLocalization(normalized.sourceLocalization)
  const neurofunctionalState = classifyNeurofunctionalState(normalized, qeegStructuredMarkers, sourceLocalizationMarkers)
  const partialContext = { signals: clinicalSignals, qeegMarkers, qeegStructuredMarkers, sourceLocalizationMarkers }
  const domainMapping = mapToDomains(partialContext)
  const context: NeurofunctionalContext = {
    input: normalized,
    signals: clinicalSignals,
    qeegMarkers,
    qeegStructuredMarkers,
    sourceLocalizationMarkers,
    rdocMappings: domainMapping.rdocMappings || [],
    networkMappings: domainMapping.networkMappings || [],
    functionalMappings: domainMapping.functionalMappings || [],
    neurofunctionalState,
  }
  const metaAnalyticEvidence = generateMetaAnalyticEvidence(context)
  const riskAssessment = calculateFunctionalRisk(context)
  const interventionPlan = generateInterventionPhases(context)
  const scoringContext: NeurofunctionalContext = { ...context, metaAnalyticEvidence, riskAssessment, interventionPlan }
  const clinicalConfidenceScore = calculateClinicalConfidenceScore(scoringContext)
  const enrichedDomainMapping: DomainMapping = { ...domainMapping, metaAnalyticEvidence, clinicalConfidenceScore }
  const hypotheses = generateHypotheses({ input: normalized, domains: enrichedDomainMapping, state: neurofunctionalState })
  const confidenceLevel = clinicalConfidenceScore.score / 100
  const inferenceTrace = [
    'Entrada clinica bruta normalizada semanticamente.',
    'Sinais clinicos extraidos sem conclusao direta por sintoma isolado.',
    'Achados qEEG convertidos em marcadores estruturados com banda, topografia, rede, funcao, energia e limitacoes.',
    'Achados de localizacao de fonte convertidos em marcadores estruturados por regiao/Brodmann explicitos, sem inferir anatomia por coordenada isolada sem atlas.',
    'Evidencia meta-analitica offline gerada por InternalMap, sem chamada externa e sem funcao diagnostica.',
    'Grau de convergencia clinica calculado como consistencia dimensional multimodal, sem finalidade diagnostica automatica.',
    'Achados mapeados por modulos dedicados de RDoC, redes funcionais e funcoes neuropsicologicas.',
    'Estado neurofuncional modulado por convergencia clinica, marcadores qEEG e localizacao de fonte.',
    'Risco funcional e intervencao por fases calculados por mapas clinicos separados.',
    'Hipoteses dimensionais e confianca calculadas com trilha auditavel.',
  ]
  const auditTrace = generateAuditTrace({
    input: normalized,
    confidenceLevel,
    riskLevel: riskAssessment.level,
    inferenceTrace,
  })

  const outputWithoutMarkdown: Omit<QuickReportOutput, 'reportMarkdown'> = {
    structuredFindings: {
      nqlBlocks: {
        PatientContext: [normalized.patient],
        ClinicalSignal: clinicalSignals,
        QEEGMarker: qeegStructuredMarkers,
        SourceLocalization: sourceLocalizationMarkers,
        MetaAnalyticEvidence: metaAnalyticEvidence,
        ClinicalConfidenceScore: [clinicalConfidenceScore],
        RDoCDomain: context.rdocMappings,
        NetworkState: context.networkMappings,
        FunctionalHypothesis: hypotheses.functionalHypotheses,
        RiskVector: [riskAssessment],
        InterventionPhase: [interventionPlan],
        AuditTrace: [auditTrace],
      },
      clinicalSignals,
      domainMapping: enrichedDomainMapping,
      functionalHypotheses: hypotheses.functionalHypotheses,
      clinicalConfidenceScore,
    },
    neurofunctionalState,
    dominantHypothesis: hypotheses.dominantHypothesis,
    differentialHypotheses: hypotheses.differentialHypotheses,
    riskLevel: riskAssessment.level,
    interventionPlan,
    clinicalConfidenceScore,
    auditTrace,
  }

  return {
    ...outputWithoutMarkdown,
    reportMarkdown: renderReport(normalized, outputWithoutMarkdown),
  }
}
