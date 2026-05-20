import {
  generateQuickReport,
  parseRawClinicalReport,
  type QuickReportOutput,
  type ReportProfile,
  type QuickReportInput,
} from '@/quick-report'

export type QuickReportEngineAdapterResult = {
  parsedInput: QuickReportInput
  result: QuickReportOutput
}

export function runQuickReportFromRawText(
  rawText: string,
  profile: ReportProfile = 'clinical',
): QuickReportEngineAdapterResult {
  const parsedInput = parseRawClinicalReport(rawText)
  const result = generateQuickReport(parsedInput, { profile })

  return {
    parsedInput,
    result,
  }
}
