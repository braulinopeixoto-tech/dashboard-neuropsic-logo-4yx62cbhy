import { getOutput, list, type ProfileRenderContext } from './profile-types'

const SCHOOL_FUNCTIONS = [
  'atencao sustentada',
  'regulacao emocional',
  'aprendizagem',
  'linguagem',
  'processamento sensorial',
  'interacao social',
  'planejamento',
  'controle inibitorio',
  'tolerancia a frustracao',
]

export function renderSchoolProfile(context: ProfileRenderContext): string {
  const output = getOutput(context)
  const functions = output.structuredFindings.domainMapping.cognitiveFunctions.filter((item) =>
    SCHOOL_FUNCTIONS.includes(item),
  )

  return [
    '# Quick Report Escolar',
    '',
    '## Identificacao',
    `Estudante: ${context.input.patient.name}`,
    `Idade: ${context.input.patient.age || 'Nao informada'}`,
    `Escola: ${context.input.patient.school || 'Nao informada'}`,
    '',
    '## Foco Funcional e Pedagogico',
    list(
      context.input.schoolHistory?.length ? context.input.schoolHistory : context.input.complaint,
    ),
    '',
    '## Funcoes que Podem Impactar a Escola',
    list(
      functions.length
        ? functions
        : output.structuredFindings.domainMapping.cognitiveFunctions.slice(0, 6),
    ),
    '',
    '## Manifestacoes Possiveis em Sala',
    list(output.structuredFindings.functionalHypotheses.slice(0, 6).map((item) => item.finding)),
    '',
    '## Sugestoes Ambientais e Pedagogicas',
    list([
      'Organizar instrucoes em etapas curtas e verificaveis.',
      'Usar rotina previsivel, antecipacao de mudancas e combinados visuais quando util.',
      'Reduzir sobrecarga sensorial em momentos de maior instabilidade.',
      'Oferecer pausas breves e estruturadas quando houver queda de regulacao.',
      'Acompanhar aprendizagem por evidencias funcionais, nao apenas por comportamento observado em um unico contexto.',
      'Favorecer comunicacao entre familia, escola e equipe clinica.',
    ]),
    '',
    '## Cuidados de Linguagem',
    'Este perfil evita detalhamento eletrofisiologico excessivo e prioriza impacto funcional, suporte pedagogico e adaptacoes observaveis.',
    '',
    '## Limites e Segurança',
    list(output.auditTrace.limitations),
    `Safety Guard aprovado: ${output.auditTrace.safetyGuardPassed ? 'sim' : 'nao'}`,
    '',
    '## Rastreabilidade',
    `Hash do input: ${output.auditTrace.inputHash}`,
    `Grau de convergencia clinica: ${output.clinicalConfidenceScore.score}/100 (${output.clinicalConfidenceScore.tier}).`,
  ].join('\n')
}
