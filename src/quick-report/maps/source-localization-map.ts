import type { BrainCoordinate, QuickReportInput, SourceLocalizationMarker } from '../types'

type SourceLocalizationInput = QuickReportInput['sourceLocalization']

type AnatomicalRule = {
  keys: string[]
  brodmannAreas: string[]
  probableNetwork: string[]
  probableFunction: string[]
  rdocDomain: string[]
  energyImpact?: SourceLocalizationMarker['energyImpact']
  organizationImpact?: SourceLocalizationMarker['organizationImpact']
}

const SOURCE_LIMITATION =
  'Achados de localizacao de fonte devem ser interpretados como inferencia funcional aproximada, sempre em correlacao clinica, neuropsicologica e eletrofisiologica.'

const COORDINATE_ATLAS_LIMITATION =
  'A coordenada foi recebida, mas a anotacao anatomica exige atlas validado externo para precisao regional.'

const ANATOMICAL_RULES: AnatomicalRule[] = [
  {
    keys: ['pre-frontal dorsolateral', 'prefrontal dorsolateral', 'dorsolateral', 'dlpfc'],
    brodmannAreas: ['BA9', 'BA46'],
    probableNetwork: ['Central Executive Network', 'Frontoparietal Control Network'],
    probableFunction: [
      'memoria operacional',
      'planejamento',
      'controle inibitorio',
      'flexibilidade cognitiva',
    ],
    rdocDomain: ['Cognitive Systems'],
    organizationImpact: 'rigid',
  },
  {
    keys: ['cingulado anterior', 'anterior cingulate', 'acc'],
    brodmannAreas: ['BA24', 'BA32'],
    probableNetwork: ['Salience Network', 'Cingulo-opercular Network'],
    probableFunction: [
      'monitoramento de erro',
      'motivacao',
      'controle emocional',
      'selecao de resposta',
    ],
    rdocDomain: ['Cognitive Systems', 'Arousal / Regulatory Systems', 'Negative Valence Systems'],
    energyImpact: 'unstable',
    organizationImpact: 'noisy',
  },
  {
    keys: ['insula', 'insular'],
    brodmannAreas: [],
    probableNetwork: ['Salience Network'],
    probableFunction: [
      'interocepcao',
      'saliencia emocional',
      'percepcao corporal',
      'integracao autonomica',
    ],
    rdocDomain: ['Arousal / Regulatory Systems', 'Negative Valence Systems'],
    energyImpact: 'unstable',
  },
  {
    keys: ['precuneus', 'pcc', 'cingulado posterior', 'posterior cingulate'],
    brodmannAreas: ['BA7', 'BA31'],
    probableNetwork: ['Default Mode Network'],
    probableFunction: [
      'autorreferencia',
      'memoria autobiografica',
      'integracao interna',
      'consciencia narrativa',
    ],
    rdocDomain: ['Social Processes', 'Cognitive Systems'],
  },
  {
    keys: ['temporal superior', 'superior temporal'],
    brodmannAreas: ['BA22'],
    probableNetwork: ['Language Network', 'Auditory Network', 'Social Processes Network'],
    probableFunction: ['linguagem receptiva', 'processamento auditivo', 'cognicao social'],
    rdocDomain: ['Social Processes', 'Cognitive Systems'],
  },
  {
    keys: ['parietal inferior', 'inferior parietal'],
    brodmannAreas: ['BA39', 'BA40'],
    probableNetwork: ['Default Mode Network', 'Language Network', 'Frontoparietal Control Network'],
    probableFunction: ['integracao multimodal', 'leitura', 'calculo', 'atencao', 'linguagem'],
    rdocDomain: ['Cognitive Systems'],
  },
  {
    keys: ['occipital', 'visual'],
    brodmannAreas: ['BA17', 'BA18', 'BA19'],
    probableNetwork: ['Visual Network'],
    probableFunction: ['processamento visual primario/secundario', 'integracao visuoespacial'],
    rdocDomain: ['Sensorimotor Systems', 'Cognitive Systems'],
  },
  {
    keys: ['sensorio-motor', 'sensoriomotor', 'sensorimotor', 'motor', 'somatossensorial'],
    brodmannAreas: ['BA1', 'BA2', 'BA3', 'BA4', 'BA6'],
    probableNetwork: ['Sensorimotor Network'],
    probableFunction: ['controle motor', 'integracao somatossensorial', 'planejamento motor'],
    rdocDomain: ['Sensorimotor Systems'],
  },
]

function uniq<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))]
}

function normalizeText(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeBrodmann(value?: string): string | undefined {
  if (!value) return undefined
  const match = value.toUpperCase().match(/BA\s*\d+/)
  return match ? match[0].replace(/\s+/g, '') : value.trim()
}

function inferHemisphere(coordinate?: BrainCoordinate): SourceLocalizationMarker['hemisphere'] {
  if (!coordinate) return 'uncertain'
  if (coordinate.x < -2) return 'left'
  if (coordinate.x > 2) return 'right'
  return 'midline'
}

function coordinateEvidence(coordinate?: BrainCoordinate): string[] {
  if (!coordinate) return []
  return [
    `Coordenada ${coordinate.system}: x=${coordinate.x}, y=${coordinate.y}, z=${coordinate.z}`,
  ]
}

function findRule(region?: string, brodmannArea?: string): AnatomicalRule | undefined {
  const normalizedRegion = normalizeText(region)
  const normalizedBA = normalizeBrodmann(brodmannArea)

  return ANATOMICAL_RULES.find((rule) => {
    const regionMatch =
      normalizedRegion && rule.keys.some((key) => normalizedRegion.includes(normalizeText(key)))
    const baMatch = normalizedBA && rule.brodmannAreas.includes(normalizedBA)
    return regionMatch || baMatch
  })
}

function buildMarker(params: {
  sourceLocalization: SourceLocalizationInput
  coordinate?: BrainCoordinate
  region?: string
  brodmannArea?: string
}): SourceLocalizationMarker {
  const brodmannArea = normalizeBrodmann(params.brodmannArea)
  const rule = findRule(params.region, brodmannArea)
  const evidence = uniq([
    params.sourceLocalization?.method ? `Metodo: ${params.sourceLocalization.method}` : '',
    params.region ? `Regiao informada: ${params.region}` : '',
    brodmannArea ? `Area de Brodmann: ${brodmannArea}` : '',
    ...coordinateEvidence(params.coordinate),
  ])
  const limitations = [SOURCE_LIMITATION]

  if (params.coordinate && !params.region && !brodmannArea) {
    limitations.push(COORDINATE_ATLAS_LIMITATION)
  }

  if (!rule) {
    limitations.push(
      'Regiao ou area de Brodmann sem regra textual inicial; inferencia de rede e funcao limitada.',
    )
  }

  return {
    method: params.sourceLocalization?.method,
    coordinate: params.coordinate,
    region: params.region,
    brodmannArea,
    hemisphere: inferHemisphere(params.coordinate),
    probableNetwork: rule?.probableNetwork,
    probableFunction: rule?.probableFunction,
    rdocDomain: rule?.rdocDomain,
    energyImpact: rule?.energyImpact || 'uncertain',
    organizationImpact: rule?.organizationImpact || 'uncertain',
    evidence,
    confidence: Math.min(
      0.95,
      0.25 + (params.region ? 0.25 : 0) + (brodmannArea ? 0.25 : 0) + (rule ? 0.2 : 0),
    ),
    limitations,
  }
}

export function mapSourceLocalization(
  sourceLocalization?: SourceLocalizationInput,
): SourceLocalizationMarker[] {
  if (!sourceLocalization) return []

  const regions = sourceLocalization.regions || []
  const brodmannAreas = sourceLocalization.brodmannAreas || []
  const coordinates = sourceLocalization.coordinates || []
  const maxLength = Math.max(regions.length, brodmannAreas.length, coordinates.length, 1)

  return Array.from({ length: maxLength }).map((_, index) =>
    buildMarker({
      sourceLocalization,
      coordinate: coordinates[index],
      region: regions[index],
      brodmannArea: brodmannAreas[index],
    }),
  )
}
