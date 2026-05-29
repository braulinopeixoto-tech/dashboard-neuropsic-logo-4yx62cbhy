import type { QuickReportInput } from '../types'

function clean(value?: string): string | undefined {
  const cleaned = (value || '')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s*/, '')
    .trim()
  return cleaned || undefined
}

function findLabel(rawText: string, labels: string[]): string | undefined {
  const lines = rawText.split(/\r?\n/)
  for (const line of lines) {
    const cleaned = line.replace(/\*\*/g, '').trim()
    const match = labels
      .map((label) => new RegExp(`^${label}\\s*:\\s*(.+)$`, 'i'))
      .map((pattern) => cleaned.match(pattern))
      .find(Boolean)
    if (match?.[1]) return clean(match[1])
  }
  return undefined
}

function inferPurpose(rawText: string): QuickReportInput['requestedPurpose'] {
  const text = rawText.toLowerCase()
  if (
    text.includes('beneficio') ||
    text.includes('benefício') ||
    text.includes('juridico') ||
    text.includes('jurídico')
  )
    return 'legal_social_benefit'
  if (text.includes('encaminhamento') || text.includes('diagnost')) return 'diagnostic_referral'
  if (text.includes('evolucao') || text.includes('evolução')) return 'evolution_report'
  if (text.includes('rastreamento')) return 'screening'
  return 'clinical_summary'
}

export function extractMetadata(rawText: string): {
  patient: QuickReportInput['patient']
  responsibleProfessional?: string
  documentPurpose?: string
  requestedPurpose: QuickReportInput['requestedPurpose']
} {
  const name = findLabel(rawText, ['Paciente']) || 'Paciente nao identificado'
  const age = findLabel(rawText, ['Idade'])
  const birthDate = findLabel(rawText, ['Data de nascimento', 'Nascimento'])
  const city = findLabel(rawText, ['Municipio', 'Município', 'Cidade'])
  const school = findLabel(rawText, ['Escola', 'Ocupacao', 'Ocupação'])
  const guardian = findLabel(rawText, ['Responsavel', 'Responsável'])
  const responsibleProfessional = findLabel(rawText, ['Responsavel Tecnico', 'Responsável Técnico'])
  const documentPurpose = findLabel(rawText, ['Finalidade do Documento', 'Finalidade'])

  return {
    patient: {
      name,
      age,
      birthDate,
      city,
      school,
      guardian: guardian === responsibleProfessional ? undefined : guardian,
    },
    responsibleProfessional,
    documentPurpose,
    requestedPurpose: inferPurpose(`${documentPurpose || ''}\n${rawText}`),
  }
}
