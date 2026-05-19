import type { AuditTrace, NormalizedQuickReportInput, RiskLevel } from './types'

export const QUICK_REPORT_ENGINE_VERSION = '0.1.0-nql-core'

const FIELD_LABELS: Array<[keyof NormalizedQuickReportInput, string]> = [
  ['complaint', 'queixa clinica'],
  ['developmentalHistory', 'historia do desenvolvimento'],
  ['clinicalHistory', 'historia clinica'],
  ['schoolHistory', 'historia escolar'],
  ['behavioralFindings', 'achados comportamentais'],
  ['psychometricFindings', 'achados psicometricos'],
  ['qeeg', 'qEEG'],
  ['sourceLocalization', 'localizacao de fonte'],
]

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(',')}}`
}

export function hashInput(input: unknown): string {
  const content = stableStringify(input)
  let hash = 2166136261

  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function listFieldsUsed(input: NormalizedQuickReportInput): string[] {
  return FIELD_LABELS.filter(([field]) => {
    const value = input[field]
    if (Array.isArray(value)) return value.length > 0
    if (value && typeof value === 'object') return Object.keys(value).length > 0
    return Boolean(value)
  }).map(([, label]) => label)
}

export function listFieldsMissing(input: NormalizedQuickReportInput): string[] {
  return FIELD_LABELS.filter(([field]) => {
    const value = input[field]
    if (Array.isArray(value)) return value.length === 0
    if (value && typeof value === 'object') return Object.keys(value).length === 0
    return !value
  }).map(([, label]) => label)
}

export function buildLimitations(input: NormalizedQuickReportInput): string[] {
  const limitations = [
    'Este Quick Report organiza convergencias funcionais e nao substitui avaliacao clinica completa.',
    'As hipoteses devem ser correlacionadas com entrevista, observacao clinica e instrumentos padronizados.',
  ]

  if (!input.qeeg?.findings?.length) {
    limitations.push(
      'Nao foram informados achados de qEEG; a classificacao neurofuncional fica limitada.',
    )
  }

  if (
    !input.sourceLocalization?.regions?.length &&
    !input.sourceLocalization?.coordinates?.length
  ) {
    limitations.push('Nao foram informados dados de sLORETA/eLORETA ou coordenadas MNI/Talairach.')
  }

  if (!input.psychometricFindings?.length) {
    limitations.push('Nao foram informados resultados psicometricos detalhados.')
  }

  if (input.flags?.juridicalSensitivity) {
    limitations.push(
      'Uso juridico ou assistencial exige revisao profissional e linguagem pericial apropriada.',
    )
  }

  return limitations
}

export function buildRiskAlerts(input: NormalizedQuickReportInput, riskLevel: RiskLevel): string[] {
  const source = input.allFindings.join(' ').toLowerCase()
  const neurologicalSignals = [
    'cefaleia',
    'tontura',
    'enjoo',
    'convulsao',
    'convulsões',
    'regressao',
    'regressão',
    'alteracao subita',
    'alteração súbita',
    'sinal neurologico',
    'sinal neurológico',
  ]

  const alerts: string[] = []
  if (riskLevel === 'high')
    alerts.push('Risco funcional elevado; recomenda-se acompanhamento clinico prioritario.')
  if (
    input.flags?.requireMedicalReferral ||
    neurologicalSignals.some((signal) => source.includes(signal))
  ) {
    alerts.push('Ha sinais que justificam avaliacao medica ou neurologica complementar.')
  }

  return alerts
}

export function generateAuditTrace(params: {
  input: NormalizedQuickReportInput
  confidenceLevel: number
  riskLevel: RiskLevel
  inferenceTrace: string[]
}): AuditTrace {
  const limitations = buildLimitations(params.input)
  const riskAlerts = buildRiskAlerts(params.input, params.riskLevel)

  return {
    inputHash: hashInput(params.input),
    generatedAt: new Date().toISOString(),
    engineVersion: QUICK_REPORT_ENGINE_VERSION,
    confidenceLevel: params.confidenceLevel,
    fieldsUsed: listFieldsUsed(params.input),
    fieldsMissing: listFieldsMissing(params.input),
    limitations,
    riskAlerts,
    inferenceTrace: params.inferenceTrace,
  }
}
