import type { NeurofunctionalContext, SafetyFinding, SafetyGuardResult, SafetySeverity } from '../types'

type ReplacementRule = {
  code: string
  pattern: RegExp
  unsafeTerm: string
  replacement: string
  severity: SafetySeverity
  message: string
  suggestion: string
  requiresFunctionalEvidence?: boolean
}

const REPLACEMENT_RULES: ReplacementRule[] = [
  {
    code: 'diagnostic-confirmed',
    pattern: /diagnostico confirmado|diagnóstico confirmado/gi,
    unsafeTerm: 'diagnostico confirmado',
    replacement: 'hipotese clinica a ser correlacionada',
    severity: 'critical',
    message: 'Linguagem de diagnostico confirmado foi detectada e substituida.',
    suggestion: 'Usar hipotese clinica a ser correlacionada.',
  },
  {
    code: 'cure-promise',
    pattern: /\bcura\b/gi,
    unsafeTerm: 'cura',
    replacement: 'melhora funcional',
    severity: 'critical',
    message: 'Promessa de cura foi detectada e substituida.',
    suggestion: 'Usar melhora funcional.',
  },
  {
    code: 'result-guarantee',
    pattern: /garantia de resultado/gi,
    unsafeTerm: 'garantia de resultado',
    replacement: 'objetivo terapeutico',
    severity: 'critical',
    message: 'Garantia de resultado foi detectada e substituida.',
    suggestion: 'Usar objetivo terapeutico.',
  },
  {
    code: 'diagnostic-probability',
    pattern: /probabilidade diagnostica|probabilidade diagnóstica/gi,
    unsafeTerm: 'probabilidade diagnostica',
    replacement: 'grau de convergencia clinica',
    severity: 'critical',
    message: 'Expressao de probabilidade diagnostica foi detectada e substituida.',
    suggestion: 'Usar grau de convergencia clinica.',
  },
  {
    code: 'adhd-spectrum',
    pattern: /espectro do tdah/gi,
    unsafeTerm: 'espectro do TDAH',
    replacement: 'perfil atencional/executivo a ser correlacionado',
    severity: 'critical',
    message: 'Termo espectro do TDAH foi detectado e substituido.',
    suggestion: 'Usar perfil atencional/executivo a ser correlacionado.',
  },
  {
    code: 'brain-lesion-functional-only',
    pattern: /lesao cerebral|lesão cerebral/gi,
    unsafeTerm: 'lesao cerebral',
    replacement: 'alteracao funcional sugerida',
    severity: 'critical',
    message: 'Referencia a lesao cerebral foi detectada sem imagem estrutural informada e substituida.',
    suggestion: 'Usar alteracao funcional sugerida quando houver apenas qEEG/source localization.',
    requiresFunctionalEvidence: true,
  },
  {
    code: 'causal-language',
    pattern: /causado por/gi,
    unsafeTerm: 'causado por',
    replacement: 'associado a',
    severity: 'warning',
    message: 'Linguagem causal foi detectada e substituida por associacao funcional.',
    suggestion: 'Usar associado a quando a evidencia for correlacional.',
  },
  {
    code: 'definitive-treatment',
    pattern: /tratamento definitivo/gi,
    unsafeTerm: 'tratamento definitivo',
    replacement: 'plano de intervencao por fases',
    severity: 'critical',
    message: 'Tratamento definitivo foi detectado e substituido.',
    suggestion: 'Usar plano de intervencao por fases.',
  },
  {
    code: 'normalize-brain',
    pattern: /normalizar o cerebro|normalizar o cérebro/gi,
    unsafeTerm: 'normalizar o cerebro',
    replacement: 'favorecer regulacao neurofuncional',
    severity: 'critical',
    message: 'Promessa de normalizacao cerebral foi detectada e substituida.',
    suggestion: 'Usar favorecer regulacao neurofuncional.',
  },
  {
    code: 'reverse-autism',
    pattern: /reverter autismo/gi,
    unsafeTerm: 'reverter autismo',
    replacement: 'favorecer recursos funcionais e adaptativos',
    severity: 'critical',
    message: 'Promessa de reversao de autismo foi detectada e substituida.',
    suggestion: 'Usar favorecer recursos funcionais e adaptativos.',
  },
  {
    code: 'reverse-adhd',
    pattern: /reverter tdah/gi,
    unsafeTerm: 'reverter TDAH',
    replacement: 'favorecer regulacao atencional e executiva',
    severity: 'critical',
    message: 'Promessa de reversao de TDAH foi detectada e substituida.',
    suggestion: 'Usar favorecer regulacao atencional e executiva.',
  },
]

const MEDICAL_RISK_TERMS = [
  'cefaleia recorrente',
  'cefaleia',
  'tontura',
  'enjoo',
  'convulsao',
  'convulsões',
  'convulsoes',
  'regressao',
  'regressão',
  'alteracao subita',
  'alteração súbita',
  'ideacao suicida',
  'ideação suicida',
  'autoagressao',
  'autoagressão',
]

function hasFunctionalEvidenceOnly(context: NeurofunctionalContext): boolean {
  return context.qeegStructuredMarkers.length > 0 || context.sourceLocalizationMarkers.length > 0
}

function hasMedicalRisk(context: NeurofunctionalContext): boolean {
  const text = context.input.allFindings.join(' ').toLowerCase()
  return context.riskAssessment?.level === 'high' || MEDICAL_RISK_TERMS.some((term) => text.includes(term))
}

function hasMedicalReferral(markdown: string): boolean {
  const text = markdown.toLowerCase()
  return (
    text.includes('avaliacao medica') ||
    text.includes('avaliação médica') ||
    text.includes('neurologica') ||
    text.includes('neurológica') ||
    text.includes('psiquiatrica') ||
    text.includes('psiquiátrica') ||
    text.includes('correlacao medica') ||
    text.includes('correlação médica')
  )
}

function unique(items: string[]): string[] {
  return [...new Set(items)]
}

function applyReplacementRules(markdown: string, context: NeurofunctionalContext): {
  markdown: string
  findings: SafetyFinding[]
  sanitizedTerms: string[]
} {
  let sanitizedMarkdown = markdown
  const findings: SafetyFinding[] = []
  const sanitizedTerms: string[] = []

  REPLACEMENT_RULES.forEach((rule) => {
    if (rule.requiresFunctionalEvidence && !hasFunctionalEvidenceOnly(context)) return

    const matches = sanitizedMarkdown.match(rule.pattern)
    if (!matches?.length) return

    sanitizedMarkdown = sanitizedMarkdown.replace(rule.pattern, rule.replacement)
    sanitizedTerms.push(rule.unsafeTerm)
    findings.push({
      severity: rule.severity,
      code: rule.code,
      message: rule.message,
      suggestion: rule.suggestion,
    })
  })

  return { markdown: sanitizedMarkdown, findings, sanitizedTerms: unique(sanitizedTerms) }
}

export function renderSafetyGuardSection(result: SafetyGuardResult): string {
  const criticalCount = result.findings.filter((finding) => finding.severity === 'critical').length
  const status = result.passed ? 'aprovado sem alertas criticos' : 'revisado com alertas criticos'
  const alerts = result.findings.length
    ? result.findings.map((finding) => `- [${finding.severity}] ${finding.code}: ${finding.message}`).join('\n')
    : '- Nenhum alerta de seguranca identificado.'
  const suggestions = result.findings
    .filter((finding) => finding.suggestion)
    .map((finding) => `- ${finding.suggestion}`)
  const terms = result.sanitizedTerms.length ? result.sanitizedTerms.map((term) => `- ${term}`).join('\n') : '- Nenhum termo corrigido.'
  const limitations = [
    '- A verificacao textual reduz risco de linguagem indevida, mas nao substitui revisao clinica profissional.',
    ...(criticalCount > 0 ? ['- Alertas criticos indicam necessidade de revisao antes de uso documental sensivel.'] : []),
    ...suggestions,
  ].join('\n')

  return [
    '## Verificacao de Seguranca Clinica',
    `- Status: ${status}.`,
    `- Alertas criticos: ${criticalCount}.`,
    '- Alertas:',
    alerts,
    '- Termos corrigidos:',
    terms,
    '- Limitacoes adicionadas:',
    limitations,
  ].join('\n')
}

export function runReportSafetyGuard(markdown: string, context: NeurofunctionalContext): SafetyGuardResult {
  const replacementResult = applyReplacementRules(markdown, context)
  let sanitizedMarkdown = replacementResult.markdown
  const findings = [...replacementResult.findings]
  const limitationsAdded: string[] = []

  if (hasMedicalRisk(context) && !hasMedicalReferral(sanitizedMarkdown)) {
    findings.push({
      severity: 'critical',
      code: 'missing-medical-referral',
      message: 'Risco clinico relevante sem recomendacao explicita de correlacao medica, neurologica ou psiquiatrica.',
      suggestion: 'Adicionar encaminhamento medico/neurologico ou psiquiatrico quando aplicavel.',
    })
    limitationsAdded.push('Risco clinico relevante exige correlacao medica, neurologica ou psiquiatrica quando aplicavel.')
    sanitizedMarkdown = [
      sanitizedMarkdown,
      '',
      'Nota de seguranca clinica: risco clinico relevante exige correlacao medica, neurologica ou psiquiatrica quando aplicavel.',
    ].join('\n')
  }

  const resultWithoutSection: SafetyGuardResult = {
    passed: !findings.some((finding) => finding.severity === 'critical'),
    findings,
    sanitizedMarkdown,
    sanitizedTerms: replacementResult.sanitizedTerms,
    limitationsAdded,
  }

  return {
    ...resultWithoutSection,
    sanitizedMarkdown: [sanitizedMarkdown, '', renderSafetyGuardSection(resultWithoutSection)].join('\n'),
  }
}
