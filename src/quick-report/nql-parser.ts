import { QuickReportInput } from './types'

export function parseNQL(nql: string, defaultPatient: any): QuickReportInput {
  const input: QuickReportInput = {
    patient: {
      name: defaultPatient?.nome || 'Não informado',
      age: defaultPatient?.data_nascimento
        ? (
            new Date().getFullYear() - new Date(defaultPatient.data_nascimento).getFullYear()
          ).toString()
        : undefined,
    },
    complaint: [],
    developmentalHistory: [],
    clinicalHistory: [],
    schoolHistory: [],
    behavioralFindings: [],
    psychometricFindings: [],
    qeeg: { findings: [] },
    sourceLocalization: { regions: [] },
    requestedPurpose: 'clinical_summary',
  }

  let currentSection = 'complaint'

  const lines = nql.split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('@') || t.startsWith('[')) {
      const sec = t.replace(/[@[\]]/g, '').toLowerCase()
      if (sec.includes('patient') || sec.includes('paciente')) currentSection = 'patient'
      else if (sec.includes('complaint') || sec.includes('queixa')) currentSection = 'complaint'
      else if (sec.includes('development') || sec.includes('desenvolvimento'))
        currentSection = 'developmentalHistory'
      else if (sec.includes('clinic') || sec.includes('clinico') || sec.includes('clínico'))
        currentSection = 'clinicalHistory'
      else if (sec.includes('school') || sec.includes('escolar')) currentSection = 'schoolHistory'
      else if (sec.includes('behavior') || sec.includes('comportamento'))
        currentSection = 'behavioralFindings'
      else if (
        sec.includes('psychometric') ||
        sec.includes('psicometrico') ||
        sec.includes('neuropsicologico')
      )
        currentSection = 'psychometricFindings'
      else if (sec.includes('qeeg')) currentSection = 'qeeg'
      else if (sec.includes('source') || sec.includes('loreta') || sec.includes('fonte'))
        currentSection = 'sourceLocalization'
      continue
    }

    if (currentSection === 'patient') {
      const [k, ...v] = t.split(':')
      if (v.length) {
        const val = v.join(':').trim()
        if (k.toLowerCase().includes('nome') || k.toLowerCase().includes('name'))
          input.patient.name = val
        if (k.toLowerCase().includes('idade') || k.toLowerCase().includes('age'))
          input.patient.age = val
      }
    } else if (currentSection === 'qeeg') {
      input.qeeg!.findings.push(t.replace(/^-/, '').trim())
    } else if (currentSection === 'sourceLocalization') {
      input.sourceLocalization!.regions!.push(t.replace(/^-/, '').trim())
    } else if (Array.isArray((input as any)[currentSection])) {
      ;(input as any)[currentSection].push(t.replace(/^-/, '').trim())
    }
  }
  return input
}
