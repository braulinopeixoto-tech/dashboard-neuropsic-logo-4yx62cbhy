import type { NeurofunctionalContext, RiskAssessment } from '../types'

const HIGH_RISK_TERMS = [
  'convulsao',
  'convulsões',
  'convulsao',
  'regressao do desenvolvimento',
  'regressão do desenvolvimento',
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

export function calculateFunctionalRisk(context: NeurofunctionalContext): RiskAssessment {
  const text = context.input.allFindings.join(' ').toLowerCase()
  const highEvidence = HIGH_RISK_TERMS.filter((term) => text.includes(term))
  const moderateEvidence = MODERATE_RISK_TERMS.filter((term) => text.includes(term))
  const deltaWakeMarkers = context.qeegStructuredMarkers.filter((marker) =>
    marker.band === 'delta' && marker.energyImpact === 'hypoactive'
  )
  const alerts = [...highEvidence, ...moderateEvidence]

  if (deltaWakeMarkers.length > 0) {
    alerts.push('delta elevado em vigilia')
  }

  if (context.input.flags?.requireMedicalReferral && !alerts.includes('encaminhamento medico requerido')) {
    alerts.push('encaminhamento medico requerido')
  }

  if (highEvidence.length > 0 || context.input.flags?.requireMedicalReferral) {
    return {
      level: 'high',
      alerts,
      evidence: context.signals.map((signal) => signal.finding).filter((finding) => alerts.some((alert) => finding.toLowerCase().includes(alert))),
      confidence: Math.min(0.95, 0.65 + alerts.length * 0.05),
    }
  }

  if (moderateEvidence.length > 0 || deltaWakeMarkers.length > 0) {
    return {
      level: 'moderate',
      alerts,
      evidence: [
        ...context.signals.map((signal) => signal.finding).filter((finding) => alerts.some((alert) => finding.toLowerCase().includes(alert))),
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
