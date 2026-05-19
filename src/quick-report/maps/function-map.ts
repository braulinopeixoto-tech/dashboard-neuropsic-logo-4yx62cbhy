import type { ClinicalSignal, FunctionalMapping } from '../types'

type Rule = {
  functionName: string
  terms: string[]
}

const RULES: Rule[] = [
  { functionName: 'atencao sustentada', terms: ['atencao sustentada', 'atenção sustentada', 'vigilancia', 'vigilância', 'distratibilidade'] },
  { functionName: 'controle inibitorio', terms: ['inibição', 'controle inibitorio', 'impulsividade', 'desinibicao', 'desinibição'] },
  { functionName: 'memoria operacional', terms: ['memoria operacional', 'memória operacional', 'memoria de trabalho', 'memória de trabalho'] },
  { functionName: 'flexibilidade cognitiva', terms: ['flexibilidade', 'rigidez', 'perseveracao', 'perseveração'] },
  { functionName: 'regulacao emocional', terms: ['regulacao emocional', 'regulação emocional', 'ansiedade', 'irritabilidade', 'labilidade'] },
  { functionName: 'processamento sensorial', terms: ['sensorial', 'hipersensibilidade', 'sensorimotor'] },
  { functionName: 'linguagem', terms: ['linguagem', 'fala', 'compreensao verbal', 'compreensão verbal'] },
  { functionName: 'aprendizagem', terms: ['aprendizagem', 'rendimento escolar', 'alfabetizacao', 'alfabetização'] },
  { functionName: 'sono/vigilia', terms: ['sono', 'insônia', 'insonia', 'vigilia', 'vigília', 'sonolencia', 'sonolência'] },
  { functionName: 'motivacao', terms: ['motivacao', 'motivação', 'apatia', 'anedonia', 'baixo engajamento'] },
  { functionName: 'interacao social', terms: ['interacao', 'interação', 'social', 'reciprocidade', 'isolamento'] },
  { functionName: 'planejamento', terms: ['planejamento', 'organizacao', 'organização', 'sequenciamento'] },
  { functionName: 'autoconsciencia', terms: ['autoconsciencia', 'autoconsciência', 'insight', 'autopercepcao', 'autopercepção'] },
  { functionName: 'tolerancia a frustracao', terms: ['frustracao', 'frustração', 'tolerancia', 'tolerância', 'oposicao', 'oposição'] },
]

export function mapSignalsToFunctions(signals: ClinicalSignal[]): FunctionalMapping[] {
  return RULES.map((rule) => {
    const evidence = signals
      .filter((signal) => {
        const text = `${signal.finding} ${signal.interpretation}`.toLowerCase()
        return rule.terms.some((term) => text.includes(term))
      })
      .map((signal) => signal.finding)

    if (evidence.length === 0) return null

    return {
      functionName: rule.functionName,
      evidence,
      confidence: Math.min(0.95, 0.3 + evidence.length * 0.15),
    }
  }).filter(Boolean) as FunctionalMapping[]
}
