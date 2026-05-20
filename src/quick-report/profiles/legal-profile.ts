import { getOutput, list, type ProfileRenderContext } from './profile-types'

export function renderLegalProfile(context: ProfileRenderContext): string {
  const output = getOutput(context)
  const audit = output.auditTrace
  const safety = output.safetyGuard

  return [
    '# Quick Report - Perfil Juridico/Social',
    '',
    '## Identificacao e Finalidade',
    `Paciente: ${context.input.patient.name}`,
    `Finalidade solicitada: ${context.input.requestedPurpose}`,
    '',
    '## Base de Dados Utilizada',
    `Campos usados: ${audit.fieldsUsed.join(', ') || 'nenhum'}`,
    `Campos ausentes: ${audit.fieldsMissing.join(', ') || 'nenhum'}`,
    '',
    '## Achados Funcionais Relevantes',
    list(output.structuredFindings.functionalHypotheses.map((item) => `${item.finding} | ${item.interpretation}`)),
    '',
    '## Impacto Funcional e Convergencia',
    output.dominantHypothesis,
    `Grau de convergencia clinica: ${output.clinicalConfidenceScore.score}/100 (${output.clinicalConfidenceScore.tier}).`,
    list(output.clinicalConfidenceScore.convergenceDrivers, 'Sem fatores multimodais suficientes.'),
    '',
    '## Risco Funcional',
    `Nivel: ${output.riskLevel}`,
    list(audit.riskAlerts, 'Sem alerta critico informado nesta etapa.'),
    '',
    '## Limitacoes e Ausencia de Causalidade Definitiva',
    list([
      ...audit.limitations,
      'Os achados indicam associacao funcional e necessidade de correlacao clinica, sem causalidade definitiva isolada.',
      'Este documento nao deve ser interpretado como conclusao absoluta sem revisao profissional contextual.',
    ]),
    '',
    '## Segurança Clínica',
    `Safety Guard aprovado: ${audit.safetyGuardPassed ? 'sim' : 'nao'}`,
    `Achados criticos: ${audit.criticalFindingsCount}`,
    list(safety.findings.map((finding) => `[${finding.severity}] ${finding.code}: ${finding.message}`), 'Nenhum achado de seguranca registrado.'),
    '',
    '## AuditTrace',
    `Hash do input: ${audit.inputHash}`,
    `Gerado em: ${audit.generatedAt}`,
    `Versao do motor: ${audit.engineVersion}`,
    `Nivel de confianca: ${Math.round(audit.confidenceLevel * 100)}%`,
    'Rastreabilidade:',
    list(audit.inferenceTrace),
  ].join('\n')
}
