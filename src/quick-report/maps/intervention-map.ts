import type { InterventionPlan, NeurofunctionalContext } from '../types'

export function generateInterventionPhases(context: NeurofunctionalContext): InterventionPlan {
  const state = context.neurofunctionalState
  const hasMedicalAlert = context.input.flags?.requireMedicalReferral
  const shouldStabilizeFirst = state.brainEnergy === 'hypoactive' || state.brainEnergy === 'unstable'
  const functions = context.functionalMappings.map((item) => item.functionName)
  const hasExecutiveDemand = functions.some((item) => ['atencao sustentada', 'controle inibitorio', 'memoria operacional', 'planejamento'].includes(item))
  const hasEmotionDemand = functions.includes('regulacao emocional') || functions.includes('tolerancia a frustracao')

  return {
    phase1: [
      'Organizar sono, alimentacao, rotina e previsibilidade ambiental.',
      'Estabelecer base regulatoria e seguranca clinica antes de aumento de demanda.',
      'Monitorar sinais autonomicos, fadiga, irritabilidade, cefaleia, tontura ou enjoo.',
      ...(hasMedicalAlert ? ['Encaminhar para avaliacao medica/neurologica complementar antes de intervencoes intensivas.'] : []),
      ...(shouldStabilizeFirst ? ['Evitar recomendacao precoce de estimulacao sem estabilizacao da base regulatoria.'] : []),
    ],
    phase2: [
      'Promover integracao funcional gradual entre redes de regulacao, atencao e controle executivo.',
      ...(hasEmotionDemand ? ['Associar psicoterapia, psicoeducacao emocional e manejo ambiental estruturado.'] : []),
      ...(hasExecutiveDemand ? ['Introduzir reabilitacao cognitiva graduada com monitoramento de sobrecarga.'] : []),
      'Considerar neurofeedback apenas com metas funcionais claras e monitoramento clinico.',
    ],
    phase3: [
      'Especializar intervencoes para funcoes prioritarias e recursos preservados.',
      'Planejar treino cognitivo direcionado, adaptacoes escolares/profissionais e performance adaptativa.',
      ...(shouldStabilizeFirst ? ['Reavaliar energia cerebral antes de neuromodulacao personalizada.'] : ['Considerar neuromodulacao personalizada somente com biomarcadores e indicacao profissional.']),
    ],
  }
}
