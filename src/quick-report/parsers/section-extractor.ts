const SECTION_ALIASES: Array<{ key: string; patterns: string[] }> = [
  { key: 'development', patterns: ['historico clinico e do neurodesenvolvimento', 'histórico clínico e do neurodesenvolvimento'] },
  { key: 'language', patterns: ['comunicacao e linguagem', 'comunicação e linguagem'] },
  { key: 'social', patterns: ['interacao social', 'interação social'] },
  { key: 'restricted', patterns: ['comportamentos restritivos e repetitivos'] },
  { key: 'sensory', patterns: ['integracao sensorial', 'integração sensorial'] },
  { key: 'sleep', patterns: ['sono e regulacao', 'sono e regulação'] },
  { key: 'qeeg', patterns: ['analise neurofuncional', 'análise neurofuncional', 'qeeg', 'qEEG'] },
  { key: 'source', patterns: ['coordenada neurofuncional', 'source localization', 'localizacao de fonte', 'localização de fonte'] },
  { key: 'recommendations', patterns: ['recomendacoes', 'recomendações'] },
]

const NOISE_PATTERNS = [
  /^#+\s*/,
  /^[-–—_]{2,}$/,
  /^\*\*?\s*$/,
  /^programa de rastreamento/i,
  /^finalidade do documento/i,
  /^relatorio neuropsicologico/i,
  /^relatório neuropsicológico/i,
  /^responsavel tecnico/i,
  /^responsável técnico/i,
  /^assinatura/i,
  /^crp\b/i,
]

const METADATA_LABELS = [
  'paciente',
  'idade',
  'data de nascimento',
  'municipio',
  'município',
  'responsavel tecnico',
  'responsável técnico',
  'responsavel',
  'responsável',
  'escola',
  'ocupacao',
  'ocupação',
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[*_`#]/g, '')
    .trim()
    .toLowerCase()
}

function stripMarkdown(value: string): string {
  return value
    .replace(/^#+\s*/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/\*\*/g, '')
    .trim()
}

function metadataLabel(line: string): string | undefined {
  const normalized = normalize(line)
  return METADATA_LABELS.find((label) => normalized.startsWith(`${normalize(label)}:`))
}

export function isNoiseLine(line: string): boolean {
  const cleaned = stripMarkdown(line)
  if (!cleaned) return true
  if (NOISE_PATTERNS.some((pattern) => pattern.test(cleaned))) return true
  if (metadataLabel(cleaned)) return true
  return SECTION_ALIASES.some((section) => section.patterns.some((pattern) => normalize(cleaned) === normalize(pattern)))
}

export function cleanClinicalLine(line: string): string {
  return stripMarkdown(line)
}

export function getSectionKey(line: string): string | undefined {
  const cleaned = normalize(stripMarkdown(line).replace(/:$/, ''))
  const section = SECTION_ALIASES.find((item) => item.patterns.some((pattern) => cleaned.includes(normalize(pattern))))
  return section?.key
}

export function extractSections(rawText: string): Record<string, string[]> {
  const sections: Record<string, string[]> = { root: [] }
  let current = 'root'

  rawText.split(/\r?\n/).forEach((line) => {
    const sectionKey = getSectionKey(line)
    if (sectionKey) {
      current = sectionKey
      sections[current] ||= []
      return
    }

    const cleaned = cleanClinicalLine(line)
    if (!cleaned || isNoiseLine(cleaned)) return
    sections[current] ||= []
    sections[current].push(cleaned)
  })

  return sections
}
