import type { NeurofunctionalContext, RiskAssessment } from '../types'

const HIGH_RISK_TERMS = [
  'convulsao',
  'convulsões',
  'convulsão',
  'regressao do desenvolvimento',
  'regressão do desenvolvimento',
  'regressao',
  'regressão',
  'alteracao subita',
  'alteração súbita',
  'ideacao suicida',
  'ideação suicida',
  'autoagressao',
  'autoagressão',
  'agressividade intensa',
  'sinais neurologicos',
  'sinais neurológicos',
]

const MODERATE_RISK_TERMS = [
  'cefaleia recorrente',
  'cefaleia',
  'tontura',
  'enjoo',
  'prejuizo escolar grave',
  'prejuízo escolar grave',
  'queda de rendimento',
  'isolamento',
  'faltas frequentes',
]

const PEDIATRIC_NEURODEVELOPMENTAL_TERMS = [
  'atraso de fala',
  'atraso na fala',
  'atraso de linguagem',
  'ecolalia',
  'rigidez',
  'seletividade alimentar',
  'hipersensibilidade tatil',
  'hipersensibilidade tátil',
  'sono irregular',
  'padroes repetitivos',
  'padrões repetitivos',
  'comportamentos repetitivos',
  'dificuldade social',
  'dificuldades sociais',
]

function parseAgeYears(age?: string): number | undefined {
  if (!age) return undefined
  const match = age.match(/\d+/)
  if (!match) return undefined
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

function matchingEvidence(context: NeurofunctionalContext, alerts: string[]): string[] {
  return context.signals
    .map((signal) => signal.finding)
    .filter((finding) => alerts.some((alert) => finding.toLowerCase().includes(alert)))
}

export function calculateFunctionalRisk(context: NeurofunctionalContext): RiskAssessment {
  const text = context.input.allFindings.join(' ').toLowerCase()
  const highEvidence = HIGH_RISK_TERMS.filter((term) => text.includes(term))
  const moderateEvidence = MODERATE_RISK_TERMS.filter((term) => text.includes(term))
  const pediatricMarkers = PEDIATRIC_NEURODEVELOPMENTAL_TERMS.filter((term) => text.includes(term))
  const ageYears = parseAgeYears(context.input.patient.age)
  const hasPediatricModerateRisk = ageYears !== undefined && ageYears <= 6 && pediatricMarkers.length >= 2
  const deltaWakeMarkers = context.qeegStructuredMarkers.filter(
    (marker) => marker.band === 'delta' && marker.energyImpact === 'hypoactive',
  )
  const alerts = [...new Set([...highEvidence, ...moderateEvidence])]

  if (deltaWakeMarkers.length > 0) {
    alerts.push('delta elevado em vigilia')
  }

  if (hasPediatricModerateRisk) {
    alerts.push('risco neurodesenvolvimental infantil moderado')
    alerts.push(...pediatricMarkers)
  }

  if (
    context.input.flags?.requireMedicalReferral &&
    !alerts.includes('encaminhamento medico requerido')
  ) {
    alerts.push('encaminhamento medico requerido')
  }

  if (highEvidence.length > 0 || context.input.flags?.requireMedicalReferral) {
    return {
      level: 'high',
      alerts: [...new Set(alerts)],
      evidence: matchingEvidence(context, alerts),
      confidence: Math.min(0.95, 0.65 + alerts.length * 0.05),
    }
  }

  if (moderateEvidence.length > 0 || deltaWakeMarkers.length > 0 || hasPediatricModerateRisk) {
    return {
      level: 'moderate',
      alerts: [...new Set(alerts)],
      evidence: [
        ...matchingEvidence(context, alerts),
        ...deltaWakeMarkers.flatMap((marker) => marker.evidence),
      ],
      confidence: Math.min(0.85, 0.5 + alerts.length * 0.05),
    }
  }

  return {
    level: 'low',
    alerts: [],
    evidence: [],
    confidence: 0.4,
  }
}
