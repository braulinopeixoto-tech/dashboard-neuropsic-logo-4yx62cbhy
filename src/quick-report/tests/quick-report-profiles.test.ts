import { generateQuickReport } from '../engine'
import type { QuickReportInput } from '../types'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const profileInput: QuickReportInput = {
  patient: { name: 'Paciente Perfil', age: '12 anos', school: 'Escola Teste' },
  complaint: ['dificuldade persistente de atencao sustentada', 'oscilacao de regulacao emocional'],
  developmentalHistory: ['historico de atraso em autorregulacao e planejamento funcional'],
  schoolHistory: ['queda de rendimento em tarefas longas'],
  behavioralFindings: ['impulsividade e baixa tolerancia a frustracao em sala'],
  psychometricFindings: ['prejuizo estruturado em memoria operacional e controle inibitorio'],
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

export function runQuickReportProfileTests(): void {
  const clinical = generateQuickReport(profileInput, { profile: 'clinical' })
  const family = generateQuickReport(profileInput, { profile: 'family' })
  const legal = generateQuickReport(profileInput, { profile: 'legal' })
  const school = generateQuickReport(profileInput, { profile: 'school' })
  const evolution = generateQuickReport(profileInput, { profile: 'evolution' })

  assert(clinical.profile === 'clinical', 'Clinical profile deve ser registrado no output.')
  assert(clinical.reportMarkdown.includes('RDoC'), 'Clinical profile deve manter linguagem tecnica como RDoC.')
  assert(clinical.reportMarkdown.includes('Marcador qEEG'), 'Clinical profile deve manter qEEG detalhado.')

  assert(family.profile === 'family', 'Family profile deve ser registrado no output.')
  assert(family.reportMarkdown.includes('Quick Report para Familia'), 'Family profile deve trocar titulo e linguagem.')
  assert(
    family.reportMarkdown.includes('rede relacionada a organizacao mental e atencao'),
    'Family profile deve simplificar Central Executive Network.',
  )
  assert(!family.reportMarkdown.includes('Central Executive Network'), 'Family profile deve evitar sigla/rede tecnica bruta.')
  assert(
    family.reportMarkdown.includes('Este relatorio nao substitui avaliacao medica quando necessaria.'),
    'Family profile deve incluir aviso medico obrigatorio.',
  )

  assert(legal.profile === 'legal', 'Legal profile deve ser registrado no output.')
  assert(legal.reportMarkdown.includes('AuditTrace'), 'Legal profile deve manter auditoria explicita.')
  assert(legal.reportMarkdown.includes('Ausencia de Causalidade Definitiva'), 'Legal profile deve declarar ausencia de causalidade definitiva.')

  assert(school.profile === 'school', 'School profile deve ser registrado no output.')
  assert(school.reportMarkdown.includes('Quick Report Escolar'), 'School profile deve usar estrutura escolar.')
  assert(school.reportMarkdown.includes('Sugestoes Ambientais e Pedagogicas'), 'School profile deve incluir suporte pedagogico.')
  assert(!school.reportMarkdown.includes('Marcador qEEG'), 'School profile deve remover excesso eletrofisiologico.')

  assert(evolution.profile === 'evolution', 'Evolution profile deve ser registrado no output.')
  assert(evolution.reportMarkdown.includes('Snapshot Atual'), 'Evolution profile deve preparar snapshot temporal.')
  assert(evolution.reportMarkdown.includes('Indicadores Comparaveis'), 'Evolution profile deve manter comparabilidade longitudinal.')
  assert(evolution.reportMarkdown.includes('VitalScore temporal'), 'Evolution profile deve preparar VitalScore temporal.')

  const scores = [family, legal, school, evolution].map((item) => item.clinicalConfidenceScore.score)
  assert(scores.every((score) => score === clinical.clinicalConfidenceScore.score), 'Profiles nao podem alterar score.')
  assert([clinical, family, legal, school, evolution].every((item) => item.reportMarkdown.includes('Verificacao de Seguranca Clinica')), 'Profiles nao podem remover Safety Guard.')
  assert([clinical, family, legal, school, evolution].every((item) => item.auditTrace.inputHash), 'AuditTrace deve continuar presente em todos os profiles.')
}
