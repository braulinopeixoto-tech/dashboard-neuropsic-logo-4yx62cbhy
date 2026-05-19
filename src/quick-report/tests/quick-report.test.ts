import { generateQuickReport } from '../engine'
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
}
