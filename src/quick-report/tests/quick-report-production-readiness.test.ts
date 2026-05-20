import { generateQuickReport } from '../engine'
import type { QuickReportInput } from '../types'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const readinessInput: QuickReportInput = {
  patient: { name: 'Paciente Mock Readiness', age: '10 anos', school: 'Escola Mock' },
  complaint: ['dificuldade de atencao sustentada', 'oscilacao de regulacao emocional'],
  developmentalHistory: ['historico de atraso em autorregulacao funcional'],
  schoolHistory: ['queda de rendimento em tarefas longas'],
  behavioralFindings: ['distratibilidade e baixa tolerancia a frustracao'],
  psychometricFindings: ['prejuizo em memoria operacional e controle inibitorio'],
  qeeg: {
    findings: ['theta aumentado em linha media'],
    frequencyHz: [6.5],
    location10_20: ['Cz'],
    amplitude: ['aumentado'],
  },
  sourceLocalization: {
    method: 'sLORETA',
    regions: ['pre-frontal dorsolateral'],
    brodmannAreas: ['BA46'],
  },
  requestedPurpose: 'clinical_summary',
}

export function runQuickReportProductionReadinessTest(): void {
  const clinicalReport = generateQuickReport(readinessInput)
  const familyReport = generateQuickReport(readinessInput, { profile: 'family' })

  assert(clinicalReport.profile === 'clinical', 'Default profile deve ser clinical.')
  assert(clinicalReport.reportMarkdown.includes('Quick Report Neurofuncional'), 'Relatorio clinico deve gerar Markdown.')
  assert(clinicalReport.reportMarkdown.includes('Verificacao de Seguranca Clinica'), 'Markdown deve incluir Safety Guard.')
  assert(clinicalReport.auditTrace.inputHash, 'AuditTrace deve conter hash.')
  assert(clinicalReport.auditTrace.safetyGuardPassed, 'Safety Guard deve passar em caso valido.')
  assert(clinicalReport.structuredFindings.nqlBlocks.AuditTrace?.length === 1, 'NQL deve manter AuditTrace.')
  assert(clinicalReport.structuredFindings.nqlBlocks.SafetyGuard?.length === 1, 'NQL deve manter SafetyGuard.')
  assert(clinicalReport.clinicalConfidenceScore.score > 0, 'Score de convergencia deve ser calculado.')
  assert(familyReport.profile === 'family', 'Family profile deve renderizar sem alterar o nucleo.')
  assert(familyReport.clinicalConfidenceScore.score === clinicalReport.clinicalConfidenceScore.score, 'Profile nao deve alterar score.')
  assert(!JSON.stringify(clinicalReport.structuredFindings).toLowerCase().includes('pocketbase'), 'Quick Report mockado nao deve tocar PocketBase.')
}
