import type { EEGFrequencyBand, QuickReportInput } from '../types'

const LOCATION_PATTERN = /\b(Fp1|Fp2|F3|F4|F7|F8|Fz|C3|C4|Cz|P3|P4|Pz|T3|T4|T5|T6|O1|O2)\b/g
const BAND_PATTERNS: Array<[EEGFrequencyBand, RegExp]> = [
  ['high_beta', /high\s*beta|beta\s*alta/i],
  ['delta', /\bdelta\b/i],
  ['theta', /\btheta\b|\bteta\b/i],
  ['alpha', /\balpha\b|\balfa\b/i],
  ['beta', /\bbeta\b/i],
  ['gamma', /\bgamma\b/i],
]

function decimal(value: string): number | undefined {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function inferBand(line: string): EEGFrequencyBand {
  return BAND_PATTERNS.find(([, pattern]) => pattern.test(line))?.[0] || 'unknown'
}

function extractFrequency(line: string): number | undefined {
  const explicit = line.match(/(?:frequencia|frequência)?\s*[:=]?\s*(\d+(?:[,.]\d+)?)\s*hz/i)
  return explicit?.[1] ? decimal(explicit[1]) : undefined
}

function extractAmplitude(line: string): string | undefined {
  const match = line.match(/(?:potencia|potência|amplitude)\s*[:=]?\s*([^.;,\n]+)/i)
  return match?.[1]?.trim()
}

function extractLocations(line: string): string | undefined {
  const locations = line.match(LOCATION_PATTERN)
  return locations?.length ? [...new Set(locations)].join(' ') : undefined
}

function isQeegLine(line: string): boolean {
  return /qEEG|eeg|frequ[eê]ncia|pot[eê]ncia|amplitude|theta|teta|alpha|alfa|beta|delta|gamma|\bFp1\b|\bFp2\b|\bFz\b|\bCz\b|\bO1\b|\bO2\b/i.test(
    line,
  )
}

export function extractQeeg(
  rawText: string,
  qeegSection: string[] = [],
): QuickReportInput['qeeg'] | undefined {
  const lines = [...qeegSection, ...rawText.split(/\r?\n/).filter(isQeegLine)]
  const findings: string[] = []
  const bands: string[] = []
  const frequencyHz: number[] = []
  const location10_20: string[] = []
  const amplitude: string[] = []

  lines.forEach((line) => {
    const frequency = extractFrequency(line)
    const band = inferBand(line)
    const locations = extractLocations(line)
    const amp = extractAmplitude(line)

    if (band === 'unknown' && frequency === undefined && !locations && !amp) return

    findings.push(line.trim())
    bands.push(band)
    if (frequency !== undefined) frequencyHz.push(frequency)
    else frequencyHz.push(undefined as unknown as number)
    if (locations) location10_20.push(locations)
    else location10_20.push('')
    if (amp) amplitude.push(amp)
    else amplitude.push('')
  })

  const filteredFindings = findings.filter(Boolean)
  if (!filteredFindings.length) return undefined

  return {
    findings: filteredFindings,
    bands,
    frequencyHz,
    location10_20,
    amplitude,
    interpretation:
      'Achados extraidos automaticamente de relatorio bruto; requerem revisao profissional.',
  }
}
