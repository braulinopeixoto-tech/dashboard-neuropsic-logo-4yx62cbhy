import type { QuickReportInput } from '../types'
import { extractMetadata } from './metadata-extractor'
import { extractQeeg } from './qeeg-extractor'
import { extractSections, isNoiseLine } from './section-extractor'
import { extractSourceLocalization } from './source-extractor'

function uniq(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

function sectionItems(sections: Record<string, string[]>, keys: string[]): string[] {
  return uniq(keys.flatMap((key) => sections[key] || []).filter((line) => !isNoiseLine(line)))
}

export function parseRawClinicalReport(rawText: string): QuickReportInput {
  const sections = extractSections(rawText)
  const metadata = extractMetadata(rawText)
  const qeeg = extractQeeg(rawText, sections.qeeg)
  const sourceLocalization = extractSourceLocalization(rawText, sections.source)

  const developmentalHistory = sectionItems(sections, ['development'])
  const clinicalHistory = sectionItems(sections, ['development', 'sleep'])
  const behavioralFindings = sectionItems(sections, ['development', 'language', 'social', 'restricted', 'sensory', 'sleep'])
  const psychometricFindings = sectionItems(sections, ['language'])
  const recommendationsRaw = sectionItems(sections, ['recommendations'])

  const complaint = uniq(
    sectionItems(sections, ['root']).filter(
      (line) =>
        !line.toLowerCase().includes('relatorio') &&
        !line.toLowerCase().includes('programa de rastreamento') &&
        !line.toLowerCase().includes('finalidade'),
    ),
  )

  return {
    patient: metadata.patient,
    complaint: complaint.length ? complaint : behavioralFindings.slice(0, 3),
    developmentalHistory,
    clinicalHistory,
    behavioralFindings,
    psychometricFindings,
    qeeg,
    sourceLocalization,
    requestedPurpose: metadata.requestedPurpose,
    responsibleProfessional: metadata.responsibleProfessional,
    documentPurpose: metadata.documentPurpose,
    recommendationsRaw,
  }
}
