import type { MetaAnalyticEvidence } from '../evidence'
import type {
  ClinicalConfidenceScore,
  NormalizedQuickReportInput,
  QEEGStructuredMarker,
  QuickReportOutput,
  SourceLocalizationMarker,
} from '../types'

const brainEnergyLabels = {
  hypoactive: 'hipoativa',
  hyperactive: 'hiperativa',
  unstable: 'instavel',
  mixed: 'mista',
}

const networkIntegrationLabels = {
  coupled: 'acoplada',
  decoupled: 'desacoplada',
  overcoupled: 'hiperacoplada',
  fragmented: 'fragmentada',
}

const organizationLabels = {
  coherent: 'coerente',
  diffuse: 'difusa',
  rigid: 'rigida',
  noisy: 'ruidosa',
}

function list(items?: string[], fallback = 'Nao informado.'): string {
  if (!items?.length) return fallback
  return items.map((item) => `- ${item}`).join('\n')
}

function numberedTitle(index: number, title: string): string {
  return `## ${index}. ${title}`
}

function percent(value: number): string {
  const normalized = value <= 1 ? value * 100 : value
  return `${Math.max(0, Math.min(100, Math.round(normalized)))}%`
}

function renderQeegMarkers(markers?: QEEGStructuredMarker[]): string {
  if (!markers?.length) return 'Nao informado.'

  return markers
    .map((marker, index) => {
      return [
        `### Marcador qEEG ${index + 1}`,
        `- Banda: ${marker.band}`,
        `- Frequencia: ${marker.frequencyHz ? `${marker.frequencyHz} Hz` : 'nao informada'}`,
        `- Localizacao 10-20: ${marker.location10_20?.join(', ') || 'nao informada'}`,
        `- Regiao provavel: ${marker.region?.join(', ') || 'nao inferida'}`,
        `- Rede provavel: ${marker.probableNetwork?.join(', ') || 'nao inferida'}`,
        `- Funcao provavel: ${marker.probableFunction?.join(', ') || 'nao inferida'}`,
        `- Impacto na energia cerebral: ${marker.energyImpact}`,
        `- Impacto na organizacao: ${marker.organizationImpact}`,
        `- Evidencias: ${marker.evidence.join(' | ') || 'nao informadas'}`,
        `- Confianca: ${percent(marker.confidence)}`,
        `- Limitacoes: ${marker.limitations.join(' | ')}`,
      ].join('\n')
    })
    .join('\n\n')
}

function renderCoordinate(marker: SourceLocalizationMarker): string {
  if (!marker.coordinate) return 'nao informada'
  return `${marker.coordinate.system}: x=${marker.coordinate.x}, y=${marker.coordinate.y}, z=${marker.coordinate.z}`
}

function renderSourceLocalization(markers?: SourceLocalizationMarker[]): string {
  if (!markers?.length) return 'Sem achados de localizacao de fonte informados.'

  return [
    '### Localizacao de Fonte',
    markers
      .map((marker, index) =>
        [
          `#### Fonte ${index + 1}`,
          `- Metodo: ${marker.method || 'nao informado'}`,
          `- Sistema/coordenada: ${renderCoordinate(marker)}`,
          `- Regiao: ${marker.region || 'nao inferida'}`,
          `- Area de Brodmann: ${marker.brodmannArea || 'nao informada'}`,
          `- Hemisferio: ${marker.hemisphere || 'uncertain'}`,
          `- Rede provavel: ${marker.probableNetwork?.join(', ') || 'nao inferida'}`,
          `- Funcao provavel: ${marker.probableFunction?.join(', ') || 'nao inferida'}`,
          `- Dominio RDoC: ${marker.rdocDomain?.join(', ') || 'nao inferido'}`,
          `- Impacto na energia cerebral: ${marker.energyImpact || 'uncertain'}`,
          `- Impacto na organizacao: ${marker.organizationImpact || 'uncertain'}`,
          `- Evidencias: ${marker.evidence.join(' | ') || 'nao informadas'}`,
          `- Confianca: ${percent(marker.confidence)}`,
          `- Limitacoes: ${marker.limitations.join(' | ')}`,
        ].join('\n'),
      )
      .join('\n\n'),
  ].join('\n')
}

function renderMetaAnalyticEvidence(items?: MetaAnalyticEvidence[]): string {
  if (!items?.length) return 'Sem evidencias meta-analiticas geradas nesta etapa.'

  return items
    .map((item, index) =>
      [
        `### Evidencia ${index + 1}`,
        `- Fonte: ${item.source}`,
        `- Tipo de consulta: ${item.queryType}`,
        `- Consulta: ${item.query}`,
        `- Termos associados: ${item.associatedTerms.join(', ') || 'nao informados'}`,
        `- Funcoes associadas: ${item.associatedFunctions.join(', ') || 'nao informadas'}`,
        `- Redes relacionadas: ${item.relatedNetworks.join(', ') || 'nao informadas'}`,
        `- Peso de evidencia: ${item.evidenceWeight}`,
        `- Confianca: ${percent(item.confidence)}`,
        `- Limitacoes: ${item.limitations.join(' | ')}`,
        `- Referencias: ${item.references?.join(', ') || 'nao informadas'}`,
      ].join('\n'),
    )
    .join('\n\n')
}

function renderClinicalConfidence(score: ClinicalConfidenceScore): string {
  return [
    `- Escore: ${score.score}/100`,
    `- Nivel: ${score.tier}`,
    '- Fatores que aumentaram a confianca:',
    list(score.convergenceDrivers, 'Nenhum fator multimodal suficiente identificado.'),
    '- Fatores que reduziram a confianca:',
    list(score.divergenceDrivers, 'Nenhum fator redutor relevante identificado.'),
    '- Dados ausentes:',
    list(score.missingData, 'Nenhum dado essencial ausente identificado.'),
    '- Alertas de cautela:',
    list(score.cautionFlags, 'Nenhum alerta adicional de cautela identificado.'),
    `- Interpretacao: ${score.interpretation}`,
    '- Limitacoes:',
    list(score.limitations),
  ].join('\n')
}

export function renderReport(input: NormalizedQuickReportInput, output: Omit<QuickReportOutput, 'reportMarkdown'>): string {
  const state = output.neurofunctionalState
  const audit = output.auditTrace
  const qeegStructuredMarkers = output.structuredFindings.domainMapping.qeegStructuredMarkers
  const sourceLocalizationMarkers = output.structuredFindings.domainMapping.sourceLocalizationMarkers
  const metaAnalyticEvidence = output.structuredFindings.domainMapping.metaAnalyticEvidence
  const clinicalConfidenceScore = output.clinicalConfidenceScore

  return [
    '# Quick Report Neurofuncional',
    '',
    numberedTitle(1, 'Identificacao'),
    `Paciente: ${input.patient.name}`,
    `Idade: ${input.patient.age || 'Nao informada'}`,
    `Data de nascimento: ${input.patient.birthDate || 'Nao informada'}`,
    `Municipio: ${input.patient.city || 'Nao informado'}`,
    `Escola/ocupacao: ${input.patient.school || 'Nao informada'}`,
    `Responsavel: ${input.patient.guardian || 'Nao informado'}`,
    `Responsavel tecnico: ${input.responsibleProfessional || 'Nao informado'}`,
    `Finalidade: ${input.documentPurpose || input.requestedPurpose}`,
    `Perfil de renderizacao: ${output.profile}`,
    '',
    numberedTitle(2, 'Motivo do encaminhamento'),
    list(input.complaint),
    '',
    numberedTitle(3, 'Dados clinicos relevantes'),
    list([...(input.clinicalHistory || []), ...(input.developmentalHistory || []), ...(input.schoolHistory || [])]),
    '',
    numberedTitle(4, 'Achados neuropsicologicos'),
    list([...(input.behavioralFindings || []), ...(input.psychometricFindings || [])]),
    '',
    numberedTitle(5, 'Achados neurofuncionais'),
    renderQeegMarkers(qeegStructuredMarkers),
    '',
    renderSourceLocalization(sourceLocalizationMarkers),
    '',
    numberedTitle(6, 'Convergencia neurofuncional'),
    `Energia cerebral: ${brainEnergyLabels[state.brainEnergy]}.`,
    `Integracao de rede: ${networkIntegrationLabels[state.networkIntegration]}.`,
    `Organizacao: ${organizationLabels[state.organization]}.`,
    '',
    'Achado, interpretacao, hipotese e recomendacao:',
    output.structuredFindings.functionalHypotheses
      .map(
        (item) =>
          `- Achado: ${item.finding}\n  - Interpretacao: ${item.interpretation}\n  - Hipotese: ${item.hypothesis}\n  - Recomendacao: ${item.recommendation}`,
      )
      .join('\n'),
    '',
    '## Evidencia Meta-Analitica',
    renderMetaAnalyticEvidence(metaAnalyticEvidence),
    '',
    '## Grau de Convergencia Clinica',
    renderClinicalConfidence(clinicalConfidenceScore),
    '',
    numberedTitle(7, 'Hipotese dominante'),
    output.dominantHypothesis,
    '',
    numberedTitle(8, 'Hipoteses diferenciais'),
    list(output.differentialHypotheses),
    '',
    numberedTitle(9, 'Riscos funcionais'),
    `Nivel de risco: ${output.riskLevel}.`,
    list(audit.riskAlerts, 'Nenhum alerta critico informado nesta triagem.'),
    '',
    numberedTitle(10, 'Vetores adaptativos'),
    'Todo padrao disfuncional pode conter vetor adaptativo. Neste caso, recomenda-se investigar recursos preservados, estrategias compensatorias e contextos em que o funcionamento melhora.',
    '',
    numberedTitle(11, 'Recomendacoes'),
    list([
      'Correlacionar os achados com entrevista clinica, observacao e instrumentos padronizados.',
      'Evitar conclusoes diagnosticas absolutas sem confirmacao interdisciplinar.',
      ...(audit.riskAlerts.length ? ['Considerar avaliacao medica complementar diante dos alertas identificados.'] : []),
      ...(input.recommendationsRaw || []),
    ]),
    '',
    numberedTitle(12, 'Intervencao por fases'),
    '### Fase 1: Base regulatoria',
    list(output.interventionPlan.phase1),
    '',
    '### Fase 2: Integracao de rede',
    list(output.interventionPlan.phase2),
    '',
    '### Fase 3: Especializacao funcional',
    list(output.interventionPlan.phase3),
    '',
    numberedTitle(13, 'Encaminhamentos'),
    list(
      audit.riskAlerts.length
        ? ['Avaliacao medica/neurologica complementar quando clinicamente indicado.', 'Seguimento neuropsicologico para refinamento das hipoteses.']
        : ['Seguimento clinico conforme evolucao e necessidade funcional.'],
    ),
    '',
    numberedTitle(14, 'Limitacoes do relatorio'),
    list(audit.limitations),
    '',
    numberedTitle(15, 'Trilha de auditoria'),
    `Hash do input: ${audit.inputHash}`,
    `Gerado em: ${audit.generatedAt}`,
    `Versao do motor: ${audit.engineVersion}`,
    `Nivel de confianca: ${percent(audit.confidenceLevel)}`,
    `Campos usados: ${audit.fieldsUsed.join(', ') || 'nenhum'}`,
    `Campos ausentes: ${audit.fieldsMissing.join(', ') || 'nenhum'}`,
    `Safety Guard aprovado: ${audit.safetyGuardPassed ? 'sim' : 'nao'}`,
    `Achados do Safety Guard: ${audit.safetyFindingsCount}`,
    `Achados criticos do Safety Guard: ${audit.criticalFindingsCount}`,
    `Termos sanitizados: ${audit.sanitizedTerms.length}`,
    'Rastreabilidade:',
    list(audit.inferenceTrace),
  ].join('\n')
}
