import type { ClinicalConfidenceScore, ConfidenceTier, NeurofunctionalContext } from '../types'

const CLOSED_DIAGNOSTIC_TERMS = [
  'probabilidade de tdah',
  'probabilidade de autismo',
  'diagnostico confirmado',
  'diagnostico fechado',
  'precisao diagnostica',
]

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function tierFor(score: number): ConfidenceTier {
  if (score < 30) return 'insufficient'
  if (score < 55) return 'low'
  if (score < 75) return 'moderate'
  return 'high'
}

function hasAny(items?: unknown[]): boolean {
  return Boolean(items?.length)
}

function inputText(context: NeurofunctionalContext): string {
  return context.input.allFindings.join(' ').toLowerCase()
}

function hasClosedDiagnosticLanguage(context: NeurofunctionalContext): boolean {
  const text = inputText(context)
  return CLOSED_DIAGNOSTIC_TERMS.some((term) => text.includes(term))
}

function hasClearClinicalSignals(context: NeurofunctionalContext): boolean {
  return context.signals.filter((signal) => signal.source !== 'qeeg' && signal.source !== 'sourceLocalization').length >= 2
}

function hasDevelopmentalHistory(context: NeurofunctionalContext): boolean {
  return Boolean(context.input.developmentalHistory?.length)
}

function hasPsychometrics(context: NeurofunctionalContext): boolean {
  return Boolean(context.input.psychometricFindings?.length)
}

function hasModerateQeeg(context: NeurofunctionalContext): boolean {
  return context.qeegStructuredMarkers.some((marker) => marker.confidence >= 0.55 && marker.band !== 'unknown')
}

function hasQeegWithoutClinicalCorrelation(context: NeurofunctionalContext): boolean {
  return hasAny(context.qeegStructuredMarkers) && !hasClearClinicalSignals(context)
}

function hasMappedSource(context: NeurofunctionalContext): boolean {
  return context.sourceLocalizationMarkers.some(
    (marker) => Boolean(marker.region || marker.brodmannArea) && Boolean(marker.probableNetwork?.length || marker.probableFunction?.length),
  )
}

function hasSourceWithoutClinicalCorrelation(context: NeurofunctionalContext): boolean {
  return hasAny(context.sourceLocalizationMarkers) && !hasClearClinicalSignals(context)
}

function hasCoordinateOnlySource(context: NeurofunctionalContext): boolean {
  return context.sourceLocalizationMarkers.some((marker) => Boolean(marker.coordinate) && !marker.region && !marker.brodmannArea)
}

function hasModerateMetaEvidence(context: NeurofunctionalContext): boolean {
  return Boolean(context.metaAnalyticEvidence?.some((item) => item.evidenceWeight === 'moderate' || item.evidenceWeight === 'high'))
}

function hasRiskClassified(context: NeurofunctionalContext): boolean {
  return Boolean(context.riskAssessment?.level)
}

function hasRiskCoherentWithFindings(context: NeurofunctionalContext): boolean {
  if (!context.riskAssessment) return false
  if (context.riskAssessment.level === 'low') return true
  return Boolean(context.riskAssessment.alerts.length || context.riskAssessment.evidence.length)
}

function hasMedicalReferralForHighRisk(context: NeurofunctionalContext): boolean {
  if (context.riskAssessment?.level !== 'high') return true
  if (context.input.flags?.requireMedicalReferral) return true
  const phaseText = [
    ...(context.interventionPlan?.phase1 || []),
    ...(context.interventionPlan?.phase2 || []),
    ...(context.interventionPlan?.phase3 || []),
  ]
    .join(' ')
    .toLowerCase()

  return phaseText.includes('medica') || phaseText.includes('neurologica')
}

function hasCoherentIntervention(context: NeurofunctionalContext): boolean {
  if (!context.interventionPlan) return false
  const phase1 = context.interventionPlan.phase1.join(' ').toLowerCase()
  const hasPhases = context.interventionPlan.phase1.length > 0 && context.interventionPlan.phase2.length > 0 && context.interventionPlan.phase3.length > 0
  if (!hasPhases) return false

  const requiresStabilization =
    context.neurofunctionalState.brainEnergy === 'hypoactive' || context.neurofunctionalState.brainEnergy === 'unstable'

  if (!requiresStabilization) return true
  return phase1.includes('evitar recomendacao precoce') || phase1.includes('base regulatoria')
}

function missingData(context: NeurofunctionalContext): string[] {
  const missing: string[] = []
  if (!context.input.developmentalHistory?.length) missing.push('historico do desenvolvimento')
  if (!context.input.psychometricFindings?.length) missing.push('achados psicometricos')
  if (!context.qeegStructuredMarkers.length) missing.push('marcadores qEEG estruturados')
  if (!context.sourceLocalizationMarkers.length) missing.push('localizacao de fonte')
  if (!context.metaAnalyticEvidence?.length) missing.push('evidencia meta-analitica')
  return missing
}

export function calculateClinicalConfidenceScore(context: NeurofunctionalContext): ClinicalConfidenceScore {
  let score = 0
  const convergenceDrivers: string[] = []
  const divergenceDrivers: string[] = []
  const cautionFlags: string[] = []
  const limitations: string[] = [
    'O escore expressa confianca na convergencia dos achados e nao deve ser interpretado como estimativa nosologica.',
    'A interpretacao exige correlacao clinica e revisao profissional.',
  ]

  if (hasClearClinicalSignals(context)) {
    score += 15
    convergenceDrivers.push('sinais clinicos claros e recorrentes')
  }

  if (hasDevelopmentalHistory(context)) {
    score += 10
    convergenceDrivers.push('historico do desenvolvimento relevante')
  }

  if (hasPsychometrics(context)) {
    score += 15
    convergenceDrivers.push('achados psicometricos estruturados')
  }

  if (hasModerateQeeg(context)) {
    score += 15
    convergenceDrivers.push('marcador qEEG estruturado com confianca moderada/alta')
  }

  if (hasMappedSource(context)) {
    score += 15
    convergenceDrivers.push('source localization com regiao/Brodmann e rede/funcao mapeada')
  }

  if (hasModerateMetaEvidence(context)) {
    score += 10
    convergenceDrivers.push('evidencia meta-analitica interna moderada/alta')
  }

  if (hasRiskClassified(context) && hasRiskCoherentWithFindings(context)) {
    score += 10
    convergenceDrivers.push('risco funcional classificado e coerente com os achados')
  }

  if (hasCoherentIntervention(context)) {
    score += 10
    convergenceDrivers.push('plano por fases coerente com o estado neurofuncional')
  }

  if (hasCoordinateOnlySource(context)) {
    score -= 20
    divergenceDrivers.push('coordenada isolada sem regiao anatomica validada por atlas')
  }

  if (hasQeegWithoutClinicalCorrelation(context)) {
    score -= 15
    divergenceDrivers.push('qEEG presente sem correlacao clinica suficiente')
  }

  if (hasSourceWithoutClinicalCorrelation(context)) {
    score -= 15
    divergenceDrivers.push('source localization presente sem correlacao clinica suficiente')
  }

  if (!hasMedicalReferralForHighRisk(context)) {
    score -= 10
    cautionFlags.push('risco alto sem encaminhamento medico/neurologico explicito')
  }

  const missing = missingData(context)
  if (missing.length >= 4) {
    score -= 10
    divergenceDrivers.push('muitos campos ausentes para convergencia multimodal')
  }

  if (hasClosedDiagnosticLanguage(context)) {
    score -= 20
    cautionFlags.push('linguagem diagnostica fechada detectada no input')
  }

  const finalScore = clampScore(score)
  const tier = tierFor(finalScore)
  const interpretation =
    tier === 'high'
      ? 'Alto grau de convergencia neurofuncional multimodal para sustentar a hipotese dimensional, sem valor de confirmacao nosologica.'
      : tier === 'moderate'
        ? 'Grau moderado de convergencia dos achados; a hipotese dimensional tem sustentacao multimodal parcial.'
        : tier === 'low'
          ? 'Baixo grau de convergencia multimodal; os achados ainda exigem maior densidade de dados e correlacao clinica.'
          : 'Dados insuficientes para sustentar convergencia dimensional defensavel nesta etapa.'

  return {
    score: finalScore,
    tier,
    convergenceDrivers,
    divergenceDrivers,
    missingData: missing,
    cautionFlags,
    interpretation,
    limitations,
  }
}
