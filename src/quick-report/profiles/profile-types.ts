import type { NeurofunctionalContext, QuickReportOutput } from '../types'

export type ReportProfile = 'clinical' | 'family' | 'legal' | 'school' | 'evolution'

export type ProfileRenderOptions = {
  profile: ReportProfile
}

export type ProfileRenderContext = NeurofunctionalContext & {
  output?: Omit<QuickReportOutput, 'reportMarkdown'>
  clinicalMarkdown?: string
}

export function list(items?: string[], fallback = 'Nao informado.'): string {
  if (!items?.length) return fallback
  return items.map((item) => `- ${item}`).join('\n')
}

export function stateLabel(value: string): string {
  const labels: Record<string, string> = {
    hypoactive: 'funcionamento com menor energia em alguns processos',
    hyperactive: 'funcionamento com maior ativacao em alguns processos',
    unstable: 'funcionamento oscilante',
    mixed: 'funcionamento misto',
    coupled: 'integracao preservada',
    decoupled: 'integracao menos eficiente entre sistemas',
    overcoupled: 'integracao rigida ou excessiva',
    fragmented: 'integracao fragmentada',
    coherent: 'organizacao coerente',
    diffuse: 'organizacao difusa',
    rigid: 'organizacao rigida',
    noisy: 'organizacao ruidosa',
  }

  return labels[value] || value
}

export function networkLabel(value: string): string {
  const labels: Record<string, string> = {
    'Central Executive Network': 'rede relacionada a organizacao mental e atencao',
    'Default Mode Network': 'rede relacionada a memoria interna, autorreferencia e integracao pessoal',
    'Salience Network': 'rede relacionada a percepcao de importancia, alerta e regulacao emocional',
    'Sensorimotor Network': 'rede relacionada a movimento, corpo e integracao sensorial',
    'Dorsal Attention Network': 'rede relacionada a atencao direcionada',
    'Ventral Attention Network': 'rede relacionada a mudanca de foco e resposta a novidades',
    'Language Network': 'rede relacionada a linguagem',
    'Auditory Network': 'rede relacionada ao processamento auditivo',
    'Visual Network': 'rede relacionada ao processamento visual',
    'Limbic Network': 'rede relacionada a emocao e motivacao',
  }

  return labels[value] || value
}

export function getOutput(context: ProfileRenderContext): Omit<QuickReportOutput, 'reportMarkdown'> {
  if (!context.output) throw new Error('Profile rendering requires QuickReport output context.')
  return context.output
}
