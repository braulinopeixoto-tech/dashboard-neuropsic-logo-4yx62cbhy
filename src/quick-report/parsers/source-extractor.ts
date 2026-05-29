import type { QuickReportInput } from '../types'

type SourceExtraction = NonNullable<QuickReportInput['sourceLocalization']>

function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase()
  return terms.some((term) => normalized.includes(term.toLowerCase()))
}

function extractBrodmann(text: string): string[] {
  return [
    ...new Set(
      (text.match(/BA\s*(44|45|46|32|24|7|31)/gi) || []).map((item) =>
        item.toUpperCase().replace(/\s+/g, ''),
      ),
    ),
  ]
}

export function extractSourceLocalization(
  rawText: string,
  sourceSection: string[] = [],
): SourceExtraction | undefined {
  const text = `${sourceSection.join('\n')}\n${rawText}`
  const regions: string[] = []
  const brodmannAreas = extractBrodmann(text)

  if (
    includesAny(text, [
      'area de broca',
      'área de broca',
      'broca',
      'cortex frontal inferior esquerdo',
      'córtex frontal inferior esquerdo',
    ])
  ) {
    regions.push('cortex frontal inferior esquerdo')
    if (!brodmannAreas.includes('BA44')) brodmannAreas.push('BA44')
    if (!brodmannAreas.includes('BA45')) brodmannAreas.push('BA45')
  }

  if (includesAny(text, ['dlpfc', 'pre-frontal dorsolateral', 'prefrontal dorsolateral'])) {
    regions.push('pre-frontal dorsolateral')
  }

  if (includesAny(text, ['cingulado anterior'])) {
    regions.push('cingulado anterior')
  }

  if (includesAny(text, ['precuneus', 'pcc', 'cingulado posterior'])) {
    regions.push('Precuneus / PCC')
  }

  const uniqueRegions = [...new Set(regions)]
  if (!uniqueRegions.length && !brodmannAreas.length) return undefined

  return {
    method: includesAny(text, ['eloreta', 'eLORETA'])
      ? 'eLORETA'
      : includesAny(text, ['sloreta', 'sLORETA', 'loreta'])
        ? 'sLORETA'
        : 'other',
    regions: uniqueRegions,
    brodmannAreas,
  }
}
