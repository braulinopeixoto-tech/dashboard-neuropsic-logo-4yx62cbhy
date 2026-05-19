import { generateQuickReport } from '../engine'
import { mapQEEGMarkers } from '../maps/qeeg-marker-map'
import { mapSourceLocalization } from '../maps/source-localization-map'
import type { QuickReportInput } from '../types'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const baseInput: QuickReportInput = {
  patient: { name: 'Paciente Teste', age: '10 anos' },
  complaint: ['dificuldade de atencao sustentada', 'ansiedade e irritabilidade'],
  behavioralFindings: ['distratibilidade e impulsividade em contexto escolar'],
  psychometricFindings: ['prejuizo em memoria operacional e controle inibitorio'],
  requestedPurpose: 'clinical_summary',
}

const fullConvergenceInput: QuickReportInput = {
  patient: { name: 'Paciente Convergencia', age: '12 anos' },
  complaint: ['dificuldade persistente de atencao sustentada', 'desorganizacao executiva recorrente'],
  developmentalHistory: ['historico de atraso em autorregulacao e planejamento funcional'],
  behavioralFindings: ['impulsividade e baixa tolerancia a frustracao em tarefas escolares'],
  psychometricFindings: ['prejuizo estruturado em memoria operacional e controle inibitorio'],
  qeeg: {
    findings: ['theta aumentado em linha media'],
    frequencyHz: [6.5],
    location10_20: ['Cz'],
    amplitude: ['aumentado'],
    interpretation: 'lentificacao funcional em linha media',
  },
  sourceLocalization: {
    method: 'sLORETA',
    regions: ['pre-frontal dorsolateral'],
    brodmannAreas: ['BA46'],
  },
  requestedPurpose: 'clinical_summary',
}

const clinicalOnlyInput: QuickReportInput = {
  patient: { name: 'Paciente Clinico', age: '9 anos' },
  complaint: ['ansiedade situacional recorrente', 'oscilacao de atencao em sala'],
  behavioralFindings: ['irritabilidade em transicoes de rotina'],
  requestedPurpose: 'clinical_summary',
}

const qeegOnlyInput: QuickReportInput = {
  patient: { name: 'Paciente qEEG Isolado', age: '11 anos' },
  complaint: [],
  qeeg: {
    findings: ['high beta elevado em regioes frontais'],
    frequencyHz: [34],
    location10_20: ['F3'],
    amplitude: ['elevado'],
  },
  requestedPurpose: 'clinical_summary',
}

const sourceOnlyInput: QuickReportInput = {
  patient: { name: 'Paciente Fonte Isolada', age: '13 anos' },
  complaint: [],
  sourceLocalization: {
    method: 'eLORETA',
    regions: ['pre-frontal dorsolateral'],
    brodmannAreas: ['BA46'],
  },
  requestedPurpose: 'clinical_summary',
}

const highRiskNoReferralInput: QuickReportInput = {
  patient: { name: 'Paciente Cautela', age: '15 anos' },
  complaint: ['ideacao suicida relatada em entrevista', 'autoagressao recente'],
  behavioralFindings: ['isolamento e prejuizo escolar grave'],
  requestedPurpose: 'diagnostic_referral',
}

const neurologicalRiskInput: QuickReportInput = {
  patient: { name: 'Paciente Risco', age: '8 anos' },
  complaint: ['cefaleia recorrente com tontura', 'alteracao subita de comportamento'],
  clinicalHistory: ['regressao do desenvolvimento relatada pela familia'],
  requestedPurpose: 'diagnostic_referral',
  flags: { requireMedicalReferral: true },
}

const hypoactiveInput: QuickReportInput = {
  patient: { name: 'Paciente Energia', age: '12 anos' },
  complaint: ['fadiga', 'sonolencia', 'baixo engajamento'],
  behavioralFindings: ['lentidao de resposta e apatia'],
  requestedPurpose: 'clinical_summary',
}

const thetaCzInput: QuickReportInput = {
  patient: { name: 'Paciente qEEG', age: '9 anos' },
  complaint: ['dificuldade de atencao sustentada'],
  qeeg: {
    findings: ['theta aumentado em linha media'],
    frequencyHz: [6.5],
    location10_20: ['Cz'],
    amplitude: ['aumentado'],
    interpretation: 'lentificacao funcional em linha media',
  },
  requestedPurpose: 'clinical_summary',
}

const deltaInput: QuickReportInput = {
  patient: { name: 'Paciente Delta', age: '11 anos' },
  complaint: ['lentificacao importante'],
  qeeg: {
    findings: ['delta elevado em vigilia'],
    frequencyHz: [2.5],
    location10_20: ['F3'],
    amplitude: ['elevado'],
  },
  requestedPurpose: 'clinical_summary',
}

const highBetaInput: QuickReportInput = {
  patient: { name: 'Paciente Beta', age: '13 anos' },
  complaint: ['ansiedade e hiperalerta'],
  qeeg: {
    findings: ['high beta elevado em regioes frontais'],
    frequencyHz: [34],
    location10_20: ['F3 F4'],
    amplitude: ['elevado'],
  },
  requestedPurpose: 'clinical_summary',
}

const sourceInput: QuickReportInput = {
  patient: { name: 'Paciente Fonte', age: '14 anos' },
  complaint: ['dificuldade de planejamento'],
  sourceLocalization: {
    method: 'sLORETA',
    regions: ['pre-frontal dorsolateral'],
    brodmannAreas: ['BA46'],
  },
  requestedPurpose: 'clinical_summary',
}

const pccSourceInput: QuickReportInput = {
  patient: { name: 'Paciente PCC', age: '16 anos' },
  complaint: ['oscilacao de autorreferencia e integracao interna'],
  sourceLocalization: {
    method: 'LORETA',
    regions: ['Precuneus / PCC'],
    brodmannAreas: ['BA31'],
  },
  requestedPurpose: 'clinical_summary',
}

const coordinateOnlyInput: QuickReportInput = {
  patient: { name: 'Paciente Coordenada', age: '15 anos' },
  complaint: ['queixa funcional inespecifica'],
  sourceLocalization: {
    method: 'eLORETA',
    coordinates: [{ system: 'MNI', x: -32, y: 18, z: 42 }],
  },
  requestedPurpose: 'clinical_summary',
}

function outputText(report: ReturnType<typeof generateQuickReport>): string {
  return JSON.stringify(report).toLowerCase()
}

export function runQuickReportSmokeTests(): void {
  const report = generateQuickReport(baseInput)
  assert(report.reportMarkdown.includes('## 15. Trilha de auditoria'), 'Relatorio deve manter as 15 secoes e auditoria.')
  assert(report.auditTrace.inputHash, 'AuditTrace deve conter hash do input.')
  assert(report.structuredFindings.domainMapping.rdocDomains.length > 0, 'RDoC deve ser preenchido.')
  assert(report.structuredFindings.domainMapping.networks.length > 0, 'Redes funcionais devem ser preenchidas.')
  assert(report.structuredFindings.domainMapping.cognitiveFunctions.length > 0, 'Funcoes devem ser preenchidas.')

  const riskReport = generateQuickReport(neurologicalRiskInput)
  assert(riskReport.riskLevel === 'high', 'Risco deve subir para alto com alerta neurologico.')
  assert(riskReport.auditTrace.riskAlerts.length > 0, 'Alertas de risco devem entrar na auditoria.')

  const hypoactiveReport = generateQuickReport(hypoactiveInput)
  assert(hypoactiveReport.neurofunctionalState.brainEnergy === 'hypoactive', 'Energia hipoativa deve ser classificada.')
  assert(
    hypoactiveReport.interventionPlan.phase1.some((item) => item.includes('Evitar recomendacao precoce')),
    'Intervencao deve evitar estimulacao precoce em energia hipoativa.',
  )

  const thetaMarkers = mapQEEGMarkers([
    { finding: 'theta aumentado em linha media', frequencyHz: 6.5, location10_20: 'Cz', amplitude: 'aumentado' },
  ])
  assert(thetaMarkers[0].band === 'theta', 'Theta 6.5 Hz em Cz deve classificar como theta.')
  const thetaReport = generateQuickReport(thetaCzInput)
  assert(
    thetaReport.neurofunctionalState.brainEnergy === 'hypoactive' || thetaReport.neurofunctionalState.brainEnergy === 'unstable',
    'Theta em Cz deve modular energia para hipoativa ou instavel.',
  )
  assert(thetaReport.reportMarkdown.includes('Marcador qEEG'), 'Marcador qEEG deve aparecer no Markdown.')

  const deltaReport = generateQuickReport(deltaInput)
  assert(
    deltaReport.structuredFindings.domainMapping.qeegStructuredMarkers?.[0].limitations.some((item) => item.includes('Delta elevado')),
    'Delta em vigilia deve adicionar limitacao clinica.',
  )

  const highBetaReport = generateQuickReport(highBetaInput)
  assert(highBetaReport.neurofunctionalState.brainEnergy === 'hyperactive', 'High beta elevado deve sugerir hiperexcitacao.')

  const noQeegReport = generateQuickReport(baseInput)
  assert(noQeegReport.reportMarkdown.includes('Nao informado'), 'qEEG ausente nao deve quebrar o relatorio.')
  assert(!noQeegReport.dominantHypothesis.toLowerCase().includes('diagnostico fechado'), 'qEEG nao deve gerar diagnostico fechado.')

  const ba46Markers = mapSourceLocalization({ method: 'sLORETA', brodmannAreas: ['BA46'] })
  assert(ba46Markers[0].probableNetwork?.includes('Central Executive Network'), 'BA46 deve mapear para rede executiva.')

  const ba32Markers = mapSourceLocalization({ method: 'eLORETA', brodmannAreas: ['BA32'] })
  assert(ba32Markers[0].probableNetwork?.includes('Salience Network'), 'BA32 deve mapear para Salience Network.')
  assert(ba32Markers[0].probableNetwork?.includes('Cingulo-opercular Network'), 'BA32 deve mapear para rede cingulo-opercular.')

  const pccMarkers = mapSourceLocalization({ method: 'LORETA', regions: ['Precuneus / PCC'] })
  assert(pccMarkers[0].probableNetwork?.includes('Default Mode Network'), 'Precuneus/PCC deve mapear para DMN.')

  const coordinateReport = generateQuickReport(coordinateOnlyInput)
  assert(
    coordinateReport.structuredFindings.domainMapping.sourceLocalizationMarkers?.[0].limitations.some((item) => item.includes('atlas validado')),
    'Coordenada sem regiao deve gerar limitacao de atlas.',
  )

  const sourceReport = generateQuickReport(sourceInput)
  assert(sourceReport.reportMarkdown.includes('Localizacao de Fonte'), 'Markdown deve mostrar Localizacao de Fonte.')
  assert(sourceReport.structuredFindings.domainMapping.networks.includes('Central Executive Network'), 'Source deve entrar nas redes do dominio.')
  assert(sourceReport.structuredFindings.domainMapping.rdocDomains.includes('Cognitive Systems'), 'Source deve entrar em RDoC.')

  const ba46Evidence = sourceReport.structuredFindings.domainMapping.metaAnalyticEvidence?.[0]
  assert(ba46Evidence?.associatedFunctions.includes('memoria operacional'), 'BA46 deve gerar evidencia para funcoes executivas.')
  assert(ba46Evidence?.relatedNetworks.includes('Central Executive Network'), 'BA46 deve gerar evidencia para rede executiva.')

  const pccReport = generateQuickReport(pccSourceInput)
  const pccEvidence = pccReport.structuredFindings.domainMapping.metaAnalyticEvidence?.[0]
  assert(pccEvidence?.relatedNetworks.includes('Default Mode Network'), 'PCC/Precuneus deve gerar evidencia para DMN.')
  assert(pccEvidence?.associatedFunctions.includes('autorreferencia'), 'PCC/Precuneus deve gerar evidencia para autorreferencia.')

  const coordinateEvidence = coordinateReport.structuredFindings.domainMapping.metaAnalyticEvidence?.[0]
  assert(coordinateEvidence?.evidenceWeight === 'uncertain', 'Coordenada isolada deve gerar evidencia incerta.')
  assert(
    coordinateEvidence?.limitations.some((item) => item.includes('Coordenada isolada')),
    'Coordenada isolada deve exigir anotacao anatomica antes de associacao meta-analitica.',
  )

  const noSourceReport = generateQuickReport(baseInput)
  assert(noSourceReport.reportMarkdown.includes('Sem achados de localizacao de fonte'), 'Source ausente nao deve quebrar o relatorio.')
  assert(noSourceReport.reportMarkdown.includes('Sem evidencias meta-analiticas'), 'Evidencia ausente nao deve quebrar o relatorio.')
  assert(sourceReport.reportMarkdown.includes('Evidencia Meta-Analitica'), 'Markdown deve mostrar Evidencia Meta-Analitica.')
  assert(!sourceReport.dominantHypothesis.toLowerCase().includes('diagnostico fechado'), 'Source localization isolada nao deve gerar diagnostico fechado.')
  assert(!sourceReport.reportMarkdown.toLowerCase().includes('diagnostico fechado'), 'Evidencia meta-analitica nao deve gerar diagnostico fechado.')

  const fullConfidenceReport = generateQuickReport(fullConvergenceInput)
  assert(
    fullConfidenceReport.clinicalConfidenceScore.tier === 'moderate' || fullConfidenceReport.clinicalConfidenceScore.tier === 'high',
    'Caso com clinica, psicometria, qEEG, source e evidencia deve gerar tier moderate/high.',
  )
  assert(fullConfidenceReport.reportMarkdown.includes('Grau de Convergencia Clinica'), 'Markdown deve mostrar Grau de Convergencia Clinica.')
  assert(
    fullConfidenceReport.clinicalConfidenceScore.convergenceDrivers.includes('marcador qEEG estruturado com confianca moderada/alta'),
    'qEEG estruturado deve aumentar a confianca de convergencia.',
  )
  assert(
    fullConfidenceReport.clinicalConfidenceScore.convergenceDrivers.includes('source localization com regiao/Brodmann e rede/funcao mapeada'),
    'Source localization mapeada deve aumentar a confianca de convergencia.',
  )

  const clinicalOnlyReport = generateQuickReport(clinicalOnlyInput)
  assert(clinicalOnlyReport.clinicalConfidenceScore.tier !== 'high', 'Caso apenas clinico nunca deve gerar tier high.')

  const coordinateOnlyReport = generateQuickReport(coordinateOnlyInput)
  assert(
    coordinateOnlyReport.clinicalConfidenceScore.divergenceDrivers.includes('coordenada isolada sem regiao anatomica validada por atlas'),
    'Coordenada isolada deve reduzir o score.',
  )

  const qeegOnlyReport = generateQuickReport(qeegOnlyInput)
  assert(qeegOnlyReport.clinicalConfidenceScore.tier !== 'high', 'qEEG isolado nao deve gerar tier high.')
  assert(
    qeegOnlyReport.clinicalConfidenceScore.divergenceDrivers.includes('qEEG presente sem correlacao clinica suficiente'),
    'qEEG sem clinica deve ser penalizado.',
  )

  const sourceOnlyReport = generateQuickReport(sourceOnlyInput)
  assert(sourceOnlyReport.clinicalConfidenceScore.tier !== 'high', 'Source localization isolada nao deve gerar tier high.')
  assert(
    sourceOnlyReport.clinicalConfidenceScore.divergenceDrivers.includes('source localization presente sem correlacao clinica suficiente'),
    'Source sem clinica deve ser penalizada.',
  )

  const highRiskNoReferralReport = generateQuickReport(highRiskNoReferralInput)
  assert(highRiskNoReferralReport.riskLevel === 'high', 'Input com autoagressao/ideacao deve gerar risco alto.')
  assert(
    highRiskNoReferralReport.clinicalConfidenceScore.cautionFlags.includes('risco alto sem encaminhamento medico/neurologico explicito'),
    'Risco alto sem encaminhamento deve gerar cautionFlag.',
  )

  const prohibitedOutputs = [fullConfidenceReport, clinicalOnlyReport, qeegOnlyReport, sourceOnlyReport, highRiskNoReferralReport]
  prohibitedOutputs.forEach((item) => {
    const text = outputText(item)
    assert(!text.includes('probabilidade diagnostica'), 'Output nao deve usar probabilidade diagnostica.')
    assert(!text.includes('probabilidade diagnóstica'), 'Output nao deve usar probabilidade diagnostica acentuada.')
  })
}
