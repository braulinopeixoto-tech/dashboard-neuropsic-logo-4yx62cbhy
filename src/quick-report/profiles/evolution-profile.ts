import { getOutput, list, stateLabel, type ProfileRenderContext } from './profile-types'

export function renderEvolutionProfile(context: ProfileRenderContext): string {
  const output = getOutput(context)

  return [
    '# Quick Report Evolutivo',
    '',
    '## Snapshot Atual',
    `Paciente: ${context.input.patient.name}`,
    `Gerado em: ${output.auditTrace.generatedAt}`,
    `Hash do input: ${output.auditTrace.inputHash}`,
    '',
    '## Indicadores Comparaveis',
    `Grau de convergencia clinica: ${output.clinicalConfidenceScore.score}/100 (${output.clinicalConfidenceScore.tier}).`,
    `Risco funcional: ${output.riskLevel}.`,
    `Energia cerebral: ${stateLabel(output.neurofunctionalState.brainEnergy)}.`,
    `Integracao de rede: ${stateLabel(output.neurofunctionalState.networkIntegration)}.`,
    `Organizacao: ${stateLabel(output.neurofunctionalState.organization)}.`,
    '',
    '## Vetores Para Comparacao Temporal',
    list([
      'Evolucao do score de convergencia clinica.',
      'Mudanca de risco funcional.',
      'Mudanca de energia cerebral.',
      'Mudanca de organizacao neurofuncional.',
      'Resposta ao plano de intervencao por fases.',
    ]),
    '',
    '## Resposta a Intervencao por Fases',
    '### Fase 1: Base regulatoria',
    list(output.interventionPlan.phase1),
    '### Fase 2: Integracao de rede',
    list(output.interventionPlan.phase2),
    '### Fase 3: Especializacao funcional',
    list(output.interventionPlan.phase3),
    '',
    '## Estrutura Preparada para Futuro',
    list([
      'Timeline longitudinal.',
      'Versionamento de snapshots.',
      'Biograma Longitudinal Certificado (BLC).',
      'VitalScore temporal.',
      'Comparacao entre regressao, estabilizacao e progresso funcional.',
    ]),
    '',
    '## Auditoria e Segurança',
    `Safety Guard aprovado: ${output.auditTrace.safetyGuardPassed ? 'sim' : 'nao'}`,
    `Achados do Safety Guard: ${output.auditTrace.safetyFindingsCount}`,
    list(output.auditTrace.limitations),
  ].join('\n')
}
