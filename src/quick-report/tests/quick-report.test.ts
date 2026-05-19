import { generateQuickReport } from '../engine'
import { mapQEEGMarkers } from '../maps/qeeg-marker-map'
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
}
