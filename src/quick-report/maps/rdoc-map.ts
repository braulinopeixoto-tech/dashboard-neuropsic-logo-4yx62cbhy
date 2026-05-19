import type { ClinicalSignal, RDoCMapping } from '../types'

type Rule = {
  domain: string
  construct?: string
  terms: string[]
}

const RULES: Rule[] = [
  {
    domain: 'Negative Valence Systems',
    construct: 'ameaca, perda e evitacao',
    terms: [
      'ansiedade',
      'medo',
      'evitacao',
      'evitação',
      'ameaca',
      'ameaça',
      'trauma',
      'irritabilidade',
    ],
  },
  {
    domain: 'Positive Valence Systems',
    construct: 'motivacao e recompensa',
    terms: [
      'motivacao',
      'motivação',
      'recompensa',
      'prazer',
      'apatia',
      'anedonia',
      'baixo engajamento',
    ],
  },
  {
    domain: 'Cognitive Systems',
    construct: 'atencao, memoria e controle executivo',
    terms: [
      'atencao',
      'atenção',
      'memoria',
      'memória',
      'planejamento',
      'inibição',
      'controle inibitorio',
      'funcoes executivas',
    ],
  },
  {
    domain: 'Social Processes',
    construct: 'comunicacao e reciprocidade social',
    terms: [
      'social',
      'reciprocidade',
      'comunicacao',
      'comunicação',
      'interacao',
      'interação',
      'isolamento',
    ],
  },
  {
    domain: 'Arousal / Regulatory Systems',
    construct: 'sono, vigilia e regulacao autonoma',
    terms: [
      'sono',
      'insônia',
      'insonia',
      'vigilia',
      'vigília',
      'arousal',
      'fadiga',
      'sonolencia',
      'sonolência',
    ],
  },
  {
    domain: 'Sensorimotor Systems',
    construct: 'processamento sensoriomotor',
    terms: [
      'sensorial',
      'sensoriomotor',
      'motor',
      'coordenação',
      'coordenacao',
      'hipersensibilidade',
    ],
  },
]

function matchRule(signals: ClinicalSignal[], rule: Rule): RDoCMapping | null {
  const evidence = signals
    .filter((signal) => {
      const text = `${signal.finding} ${signal.interpretation}`.toLowerCase()
      return rule.terms.some((term) => text.includes(term))
    })
    .map((signal) => signal.finding)

  if (evidence.length === 0) return null

  return {
    domain: rule.domain,
    construct: rule.construct,
    evidence,
    confidence: Math.min(0.95, 0.35 + evidence.length * 0.15),
  }
}

export function mapClinicalSignalsToRDoC(signals: ClinicalSignal[]): RDoCMapping[] {
  return RULES.map((rule) => matchRule(signals, rule)).filter(Boolean) as RDoCMapping[]
}
