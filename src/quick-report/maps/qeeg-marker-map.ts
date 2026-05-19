import type {
  BrainEnergyImpact,
  EEGFrequencyBand,
  EEGLocation10_20,
  OrganizationImpact,
  QEEGMarker,
  QEEGStructuredMarker,
} from '../types'

const VALID_LOCATIONS: EEGLocation10_20[] = [
  'Fp1',
  'Fp2',
  'F3',
  'F4',
  'F7',
  'F8',
  'C3',
  'C4',
  'Cz',
  'P3',
  'P4',
  'Pz',
  'T3',
  'T4',
  'T5',
  'T6',
  'O1',
  'O2',
  'Fz',
]

const QEEG_LIMITATION =
  'Achados eletrofisiologicos devem ser interpretados em correlacao clinica, neuropsicologica e, quando necessario, medica.'

const REGION_BY_LOCATION: Record<EEGLocation10_20, string> = {
  Fp1: 'pre-frontal/frontopolar',
  Fp2: 'pre-frontal/frontopolar',
  F3: 'frontal/executiva',
  F4: 'frontal/executiva',
  Fz: 'frontal/executiva / linha media',
  F7: 'frontotemporal',
  F8: 'frontotemporal',
  C3: 'sensorio-motora',
  C4: 'sensorio-motora',
  Cz: 'sensorio-motora / linha media',
  P3: 'parietal',
  P4: 'parietal',
  Pz: 'parietal / linha media',
  T3: 'temporal',
  T4: 'temporal',
  T5: 'temporal',
  T6: 'temporal',
  O1: 'occipital',
  O2: 'occipital',
}

function uniq<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function normalizeText(value?: string): string {
  return (value || '').trim().toLowerCase()
}

export function inferFrequencyBand(frequencyHz?: number, text = ''): EEGFrequencyBand {
  if (typeof frequencyHz === 'number') {
    if (frequencyHz >= 0.5 && frequencyHz < 4) return 'delta'
    if (frequencyHz >= 4 && frequencyHz < 8) return 'theta'
    if (frequencyHz >= 8 && frequencyHz < 12) return 'alpha'
    if (frequencyHz >= 12 && frequencyHz < 30) return 'beta'
    if (frequencyHz >= 30 && frequencyHz <= 45) return 'high_beta'
    if (frequencyHz > 45) return 'gamma'
  }

  const source = normalizeText(text)
  if (source.includes('high beta') || source.includes('high_beta') || source.includes('beta alto'))
    return 'high_beta'
  if (source.includes('delta')) return 'delta'
  if (source.includes('theta') || source.includes('teta')) return 'theta'
  if (source.includes('alpha') || source.includes('alfa')) return 'alpha'
  if (source.includes('beta')) return 'beta'
  if (source.includes('gamma')) return 'gamma'
  return 'unknown'
}

export function parseLocations(location?: string): EEGLocation10_20[] {
  if (!location) return []
  const tokens = location
    .split(/[ ,;/]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return uniq(
    tokens.filter((item): item is EEGLocation10_20 =>
      VALID_LOCATIONS.includes(item as EEGLocation10_20),
    ),
  )
}

function inferRegions(locations: EEGLocation10_20[]): string[] {
  return uniq(locations.map((location) => REGION_BY_LOCATION[location]).filter(Boolean))
}

function hasMidline(locations: EEGLocation10_20[]): boolean {
  return locations.some((location) => ['Cz', 'Fz', 'Pz'].includes(location))
}

function isElevated(marker: QEEGMarker): boolean {
  const text =
    `${marker.finding} ${marker.amplitude || ''} ${marker.interpretation || ''}`.toLowerCase()
  return ['elevado', 'aumentado', 'excesso', 'alta amplitude', 'hiper'].some((term) =>
    text.includes(term),
  )
}

function isReduced(marker: QEEGMarker): boolean {
  const text =
    `${marker.finding} ${marker.amplitude || ''} ${marker.interpretation || ''}`.toLowerCase()
  return ['reduzido', 'baixo', 'diminuido', 'diminuído', 'hipo'].some((term) => text.includes(term))
}

function inferMarkerImpact(params: {
  marker: QEEGMarker
  band: EEGFrequencyBand
  locations: EEGLocation10_20[]
}): Pick<
  QEEGStructuredMarker,
  'energyImpact' | 'organizationImpact' | 'probableNetwork' | 'probableFunction'
> {
  const elevated = isElevated(params.marker)
  const reduced = isReduced(params.marker)
  const midline = hasMidline(params.locations)

  let energyImpact: BrainEnergyImpact = 'uncertain'
  let organizationImpact: OrganizationImpact = 'uncertain'
  let probableNetwork: string[] = []
  let probableFunction: string[] = []

  if (params.band === 'theta' && elevated && midline) {
    energyImpact = 'hypoactive'
    organizationImpact = 'diffuse'
    probableNetwork = ['Central Executive Network', 'Sensorimotor Network', 'Salience Network']
    probableFunction = ['atencao sustentada', 'controle inibitorio', 'regulacao executiva']
  } else if (params.band === 'theta' && elevated) {
    energyImpact = 'unstable'
    organizationImpact = 'diffuse'
    probableNetwork = ['Central Executive Network', 'Dorsal Attention Network']
    probableFunction = ['atencao sustentada', 'memoria operacional']
  } else if (params.band === 'high_beta' && elevated) {
    energyImpact = 'hyperactive'
    organizationImpact = 'rigid'
    probableNetwork = ['Salience Network', 'Limbic Network']
    probableFunction = ['regulacao emocional', 'hiperalerta', 'tolerancia a frustracao']
  } else if (params.band === 'alpha' && reduced) {
    energyImpact = 'unstable'
    organizationImpact = 'noisy'
    probableNetwork = ['Default Mode Network', 'Salience Network']
    probableFunction = ['repouso funcional', 'inibicao cortical', 'regulacao emocional']
  } else if (params.band === 'delta' && elevated) {
    energyImpact = 'hypoactive'
    organizationImpact = 'diffuse'
    probableNetwork = ['Central Executive Network', 'Sensorimotor Network']
    probableFunction = ['lentificacao funcional', 'vigilancia', 'processamento cognitivo']
  }

  return { energyImpact, organizationImpact, probableNetwork, probableFunction }
}

export function mapQEEGMarkers(qeeg: QEEGMarker[] = []): QEEGStructuredMarker[] {
  return qeeg.map((marker) => {
    const evidence = [marker.finding, marker.band, marker.amplitude, marker.interpretation]
      .filter(Boolean)
      .map(String)
    const sourceText = evidence.join(' ')
    const band = inferFrequencyBand(marker.frequencyHz, sourceText)
    const locations = parseLocations(marker.location10_20)
    const region = inferRegions(locations)
    const impact = inferMarkerImpact({ marker, band, locations })
    const limitations = [QEEG_LIMITATION]

    if (band === 'unknown') {
      limitations.push(
        'Banda nao inferida por ausencia de frequencia ou termo eletrofisiologico explicito.',
      )
    }

    if (band === 'delta' && isElevated(marker)) {
      limitations.push(
        'Delta elevado em vigilia exige correlacao clinica e, quando indicado, avaliacao neurologica.',
      )
    }

    if (locations.length === 0) {
      limitations.push('Topografia 10-20 ausente ou nao reconhecida; inferencia regional limitada.')
    }

    return {
      band,
      frequencyHz: marker.frequencyHz,
      location10_20: locations.length ? locations : undefined,
      region: region.length ? region : undefined,
      probableNetwork: impact.probableNetwork.length ? impact.probableNetwork : undefined,
      probableFunction: impact.probableFunction.length ? impact.probableFunction : undefined,
      energyImpact: impact.energyImpact,
      organizationImpact: impact.organizationImpact,
      evidence,
      confidence: Math.min(
        0.95,
        0.25 +
          (band !== 'unknown' ? 0.25 : 0) +
          (locations.length ? 0.2 : 0) +
          (impact.energyImpact !== 'uncertain' ? 0.2 : 0),
      ),
      limitations,
    }
  })
}
