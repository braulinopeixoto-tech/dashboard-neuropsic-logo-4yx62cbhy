import { generateAuditTrace } from './audit'
import {
  calculateFunctionalRisk,
  generateInterventionPhases,
  mapClinicalSignalsToRDoC,
  mapSignalsToFunctions,
  mapSignalsToNetworks,
} from './maps'
import { renderReport } from './renderers/markdown-renderer'
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
  QuickReportInput,
  QuickReportOutput,
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

export function mapToDomains(context: Pick<NeurofunctionalContext, 'signals' | 'qeegMarkers'>): DomainMapping {
  const rdocMappings = mapClinicalSignalsToRDoC(context.signals)
  const networkMappings = mapSignalsToNetworks(context.signals, context.qeegMarkers)
  const functionalMappings = mapSignalsToFunctions(context.signals)

  return {
    rdocDomains: rdocMappings.map((item) => item.domain),
    networks: networkMappings.map((item) => item.network),
    cognitiveFunctions: functionalMappings.map((item) => item.functionName),
    rdocMappings,
    networkMappings,
    functionalMappings,
  }
}

export function classifyNeurofunctionalState(input: NormalizedQuickReportInput): QuickReportOutput['neurofunctionalState'] {
  const text = input.allFindings.join(' ').toLowerCase()
  const hyperScore = countMatches(text, HYPERAROUSAL_TERMS)
  const hypoScore = countMatches(text, HYPOACTIVE_TERMS)
  const instabilityScore = countMatches(text, INSTABILITY_TERMS)

  let brainEnergy: BrainEnergy = 'mixed'
  if (instabilityScore > 0) brainEnergy = 'unstable'
  else if (hyperScore > hypoScore) brainEnergy = 'hyperactive'
  else if (hypoScore > hyperScore) brainEnergy = 'hypoactive'

  let networkIntegration: NetworkIntegration = 'coupled'
  if (includesAny(text, ['fragmentacao', 'fragmentação', 'desorganizacao', 'desorganização'])) networkIntegration = 'fragmented'
  else if (includesAny(text, ['desacoplamento', 'isolamento funcional'])) networkIntegration = 'decoupled'
  else if (includesAny(text, ['hiperconectividade', 'hiperacoplamento', 'rigidez de rede'])) networkIntegration = 'overcoupled'

  let organization: Organization = 'coherent'
  if (includesAny(text, ['ruido', 'ruído', 'artefato', 'instavel', 'instável'])) organization = 'noisy'
  else if (includesAny(text, ['rigidez', 'perseveracao', 'perseveração'])) organization = 'rigid'
  else if (includesAny(text, ['difuso', 'desorganizado', 'desorganizacao', 'desorganização'])) organization = 'diffuse'

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

  const dominantHypothesis = `Os achados sugerem uma hipotese dimensional de disfuncao neurofuncional envolvendo ${domains}, com participacao provavel de ${networks} e impacto em ${functions}. Necessita correlacao clinica e complementar.`

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
    Boolean(input.sourceLocalization?.regions?.length || input.sourceLocalization?.coordinates?.length),
  ].filter(Boolean).length

  return Math.min(0.95, Math.max(0.15, availableSignals / 8))
}

export function generateQuickReport(input: QuickReportInput): QuickReportOutput {
  const normalized = normalizeInput(input)
  const clinicalSignals = extractClinicalSignals(normalized)
  const qeegMarkers = extractQeegMarkers(normalized)
  const neurofunctionalState = classifyNeurofunctionalState(normalized)
  const partialContext = { signals: clinicalSignals, qeegMarkers }
  const domainMapping = mapToDomains(partialContext)
  const context: NeurofunctionalContext = {
    input: normalized,
    signals: clinicalSignals,
    qeegMarkers,
    rdocMappings: domainMapping.rdocMappings || [],
    networkMappings: domainMapping.networkMappings || [],
    functionalMappings: domainMapping.functionalMappings || [],
    neurofunctionalState,
  }
  const hypotheses = generateHypotheses({ input: normalized, domains: domainMapping, state: neurofunctionalState })
  const confidenceLevel = calculateConfidence(normalized)
  const riskAssessment = calculateFunctionalRisk(context)
  const interventionPlan = generateInterventionPhases(context)
  const inferenceTrace = [
    'Entrada clinica bruta normalizada semanticamente.',
    'Sinais clinicos extraidos sem conclusao direta por sintoma isolado.',
    'Achados mapeados por modulos dedicados de RDoC, redes funcionais e funcoes neuropsicologicas.',
    'Estado neurofuncional classificado por convergencia de marcadores.',
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
        QEEGMarker: qeegMarkers,
        RDoCDomain: context.rdocMappings,
        NetworkState: context.networkMappings,
        FunctionalHypothesis: hypotheses.functionalHypotheses,
        RiskVector: [riskAssessment],
        InterventionPhase: [interventionPlan],
        AuditTrace: [auditTrace],
      },
      clinicalSignals,
      domainMapping,
      functionalHypotheses: hypotheses.functionalHypotheses,
    },
    neurofunctionalState,
    dominantHypothesis: hypotheses.dominantHypothesis,
    differentialHypotheses: hypotheses.differentialHypotheses,
    riskLevel: riskAssessment.level,
    interventionPlan,
    auditTrace,
  }

  return {
    ...outputWithoutMarkdown,
    reportMarkdown: renderReport(normalized, outputWithoutMarkdown),
  }
}
