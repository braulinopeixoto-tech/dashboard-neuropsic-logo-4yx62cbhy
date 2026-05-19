import type { ClinicalSignal, NetworkMapping, NetworkState, QEEGMarker } from '../types'

type Rule = {
  network: string
  terms: string[]
  defaultState: NetworkState
}

const RULES: Rule[] = [
  {
    network: 'Default Mode Network',
    terms: ['ruminacao', 'ruminação', 'autorreferencia', 'memoria autobiografica', 'devaneio'],
    defaultState: 'overcoupled',
  },
  {
    network: 'Salience Network',
    terms: ['saliencia', 'saliência', 'alerta', 'ameaca', 'ameaça', 'hipervigilancia'],
    defaultState: 'overcoupled',
  },
  {
    network: 'Central Executive Network',
    terms: [
      'planejamento',
      'controle executivo',
      'funcoes executivas',
      'inibição',
      'memoria operacional',
    ],
    defaultState: 'decoupled',
  },
  {
    network: 'Sensorimotor Network',
    terms: ['sensorial', 'sensoriomotor', 'motor', 'coordenação', 'coordenacao'],
    defaultState: 'uncertain',
  },
  {
    network: 'Dorsal Attention Network',
    terms: ['atencao sustentada', 'atenção sustentada', 'vigilancia', 'vigilância'],
    defaultState: 'decoupled',
  },
  {
    network: 'Ventral Attention Network',
    terms: ['distratibilidade', 'orientacao atencional', 'orientação atencional'],
    defaultState: 'fragmented',
  },
  {
    network: 'Limbic Network',
    terms: ['ansiedade', 'irritabilidade', 'medo', 'regulacao emocional', 'regulação emocional'],
    defaultState: 'overcoupled',
  },
  {
    network: 'Language Network',
    terms: ['linguagem', 'fala', 'compreensao verbal', 'compreensão verbal'],
    defaultState: 'uncertain',
  },
  {
    network: 'Auditory Network',
    terms: ['auditivo', 'processamento auditivo', 'hipersensibilidade auditiva'],
    defaultState: 'uncertain',
  },
  {
    network: 'Visual Network',
    terms: ['visual', 'processamento visual', 'visuoespacial'],
    defaultState: 'uncertain',
  },
]

function inferState(text: string, fallback: NetworkState): NetworkState {
  if (
    text.includes('fragmentacao') ||
    text.includes('fragmentação') ||
    text.includes('desorganizacao') ||
    text.includes('desorganização')
  )
    return 'fragmented'
  if (text.includes('desacoplamento') || text.includes('hipoconectividade')) return 'decoupled'
  if (text.includes('hiperconectividade') || text.includes('hiperacoplamento')) return 'overcoupled'
  if (text.includes('acoplamento preservado') || text.includes('coerencia preservada'))
    return 'coupled'
  return fallback
}

export function mapSignalsToNetworks(
  signals: ClinicalSignal[],
  qeeg: QEEGMarker[] = [],
): NetworkMapping[] {
  const qeegEvidence = qeeg.map((marker) =>
    [marker.finding, marker.band, marker.location10_20, marker.interpretation]
      .filter(Boolean)
      .join(' '),
  )

  return RULES.map((rule) => {
    const evidence = [
      ...signals
        .filter((signal) => {
          const text = `${signal.finding} ${signal.interpretation}`.toLowerCase()
          return rule.terms.some((term) => text.includes(term))
        })
        .map((signal) => signal.finding),
      ...qeegEvidence.filter((item) =>
        rule.terms.some((term) => item.toLowerCase().includes(term)),
      ),
    ]

    if (evidence.length === 0) return null

    return {
      network: rule.network,
      state: inferState(evidence.join(' ').toLowerCase(), rule.defaultState),
      evidence,
      confidence: Math.min(0.95, 0.3 + evidence.length * 0.15),
    }
  }).filter(Boolean) as NetworkMapping[]
}
