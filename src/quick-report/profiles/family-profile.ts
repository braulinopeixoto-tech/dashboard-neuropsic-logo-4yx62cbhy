import {
  getOutput,
  list,
  networkLabel,
  stateLabel,
  type ProfileRenderContext,
} from './profile-types'

export function renderFamilyProfile(context: ProfileRenderContext): string {
  const output = getOutput(context)
  const functions = output.structuredFindings.domainMapping.cognitiveFunctions.slice(0, 8)
  const networks = output.structuredFindings.domainMapping.networks.map(networkLabel)

  return [
    '# Quick Report para Familia e Responsaveis',
    '',
    '## Identificacao',
    `Paciente: ${context.input.patient.name}`,
    `Idade: ${context.input.patient.age || 'Nao informada'}`,
    '',
    '## O Que Foi Observado',
    list(context.input.complaint, 'Nao foram informadas queixas principais.'),
    '',
    '## Como Entender o Funcionamento Atual',
    `Energia cerebral: ${stateLabel(output.neurofunctionalState.brainEnergy)}.`,
    `Integracao entre sistemas: ${stateLabel(output.neurofunctionalState.networkIntegration)}.`,
    `Organizacao do funcionamento: ${stateLabel(output.neurofunctionalState.organization)}.`,
    '',
    '## Funcoes Que Merecem Atencao',
    list(functions, 'As funcoes impactadas ainda precisam ser melhor especificadas.'),
    '',
    '## Redes Funcionais em Linguagem Simples',
    list(networks, 'Nao houve rede funcional especifica suficiente para traducao familiar.'),
    '',
    '## Potenciais e Recursos Adaptativos',
    'Mesmo quando ha dificuldades, o padrao observado pode indicar recursos preservados, formas de compensacao e caminhos de reorganizacao funcional. O foco deve ser compreender o que ajuda o paciente a funcionar melhor em contextos reais.',
    '',
    '## Orientacoes Praticas',
    list([
      'Manter rotina previsivel, sono regular e reducao de sobrecarga quando necessario.',
      'Observar em quais ambientes a atencao, a regulacao emocional e a aprendizagem melhoram.',
      'Compartilhar estes achados com profissionais que acompanham o paciente.',
      'Este relatorio nao substitui avaliacao medica quando necessaria.',
    ]),
    '',
    '## Grau de Sustentacao dos Achados',
    `Escore de convergencia clinica: ${output.clinicalConfidenceScore.score}/100 (${output.clinicalConfidenceScore.tier}).`,
    output.clinicalConfidenceScore.interpretation,
    '',
    '## Limitacoes',
    list(output.auditTrace.limitations),
    '',
    '## Rastreabilidade',
    `Hash do input: ${output.auditTrace.inputHash}`,
    `Safety Guard aprovado: ${output.auditTrace.safetyGuardPassed ? 'sim' : 'nao'}`,
  ].join('\n')
}
