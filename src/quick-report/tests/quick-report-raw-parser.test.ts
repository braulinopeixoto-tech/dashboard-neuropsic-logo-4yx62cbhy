import { generateQuickReport } from '../engine'
import { parseRawClinicalReport } from '../parsers'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const rawNolanReport = `
# RELATÓRIO NEUROPSICOLÓGICO

**Paciente:** Nolan Josue Silva dos Santos
**Idade:** 4 anos
**Data de nascimento:** 10/01/2021
**Município:** Lençóis
**Responsável Técnico:** Braulino Peixoto
**Finalidade do Documento:** Programa de Rastreamento clínico neurofuncional.

--

## HISTÓRICO CLÍNICO E DO NEURODESENVOLVIMENTO
Atraso de fala observado desde fases iniciais do desenvolvimento.
Sono irregular e dificuldade de autorregulação.

## COMUNICAÇÃO E LINGUAGEM
Ecolalia presente e organização verbal ainda imatura.
Perfil compatível com necessidade de investigação complementar.

## INTERAÇÃO SOCIAL
Dificuldade social com baixa reciprocidade em algumas situações.

## COMPORTAMENTOS RESTRITIVOS E REPETITIVOS
Rigidez comportamental e padrões repetitivos em rotina.

## INTEGRAÇÃO SENSORIAL
Seletividade alimentar e hipersensibilidade tátil.

## ANÁLISE NEUROFUNCIONAL / qEEG
Theta 7,08 Hz em Fz e Cz com potência aumentada.
Alpha 9,28 Hz em Cz.
Alpha 11,23 Hz em O1, Cz e Fz.
Potência: 2 mV.
qEEG evidencia maturação elétrica atípica, observado em perfis neurodivergentes do espectro autista.

## COORDENADA NEUROFUNCIONAL
Área de Broca, córtex frontal inferior esquerdo, BA46/BA32.

## RECOMENDAÇÕES
Recomenda-se correlação médica quando clinicamente necessária.
`

export function runQuickReportRawParserTests(): void {
  const parsed = parseRawClinicalReport(rawNolanReport)

  assert(parsed.patient.name === 'Nolan Josue Silva dos Santos', 'Raw parser should extract patient name.')
  assert(parsed.patient.age === '4 anos', 'Raw parser should extract age.')
  assert(parsed.patient.city === 'Lençóis', 'Raw parser should extract city.')
  assert(parsed.responsibleProfessional === 'Braulino Peixoto', 'Raw parser should extract responsible professional.')
  assert(parsed.documentPurpose?.includes('Programa de Rastreamento'), 'Raw parser should extract document purpose.')

  const allClinicalText = [
    ...parsed.complaint,
    ...(parsed.developmentalHistory || []),
    ...(parsed.clinicalHistory || []),
    ...(parsed.behavioralFindings || []),
    ...(parsed.psychometricFindings || []),
  ].join('\n')

  assert(!allClinicalText.includes('# RELATÓRIO NEUROPSICOLÓGICO'), 'Markdown titles should not become clinical findings.')
  assert(!allClinicalText.includes('**Paciente:**'), 'Metadata labels should not become clinical findings.')

  assert(parsed.qeeg?.findings.length, 'Raw parser should extract qEEG findings.')
  assert(parsed.qeeg?.frequencyHz?.includes(7.08), 'Raw parser should extract theta 7.08 Hz.')
  assert(parsed.qeeg?.frequencyHz?.includes(9.28), 'Raw parser should extract alpha 9.28 Hz.')
  assert(parsed.qeeg?.frequencyHz?.includes(11.23), 'Raw parser should extract alpha 11.23 Hz.')
  assert(parsed.qeeg?.bands?.includes('theta'), 'Raw parser should extract theta band.')
  assert(parsed.qeeg?.bands?.includes('alpha'), 'Raw parser should extract alpha band.')
  assert(parsed.qeeg?.location10_20?.some((location) => location.includes('Fz') && location.includes('Cz')), 'Raw parser should extract Fz/Cz locations.')
  assert(parsed.qeeg?.location10_20?.some((location) => location.includes('O1')), 'Raw parser should extract O1 location.')

  assert(parsed.sourceLocalization?.regions?.includes('cortex frontal inferior esquerdo'), 'Raw parser should extract Broca/source region.')
  assert(parsed.sourceLocalization?.brodmannAreas?.includes('BA44'), 'Raw parser should infer BA44 for Broca area.')
  assert(parsed.sourceLocalization?.brodmannAreas?.includes('BA45'), 'Raw parser should infer BA45 for Broca area.')

  const report = generateQuickReport(rawNolanReport)
  assert(report.riskLevel === 'moderate', 'Child case with multiple neurodevelopmental markers should be at least moderate risk.')
  assert(report.clinicalConfidenceScore.score >= 0 && report.clinicalConfidenceScore.score <= 100, 'Confidence score should stay within 0-100.')
  assert(!report.reportMarkdown.includes('3500%'), 'Markdown should never render 3500%.')
  assert(!/\b\d{3,}%/.test(report.reportMarkdown), 'Markdown should not render confidence percentages above 100%.')
  assert(!report.reportMarkdown.includes('# RELATÓRIO NEUROPSICOLÓGICO'), 'Final Markdown should not repeat raw Markdown title as finding.')
  assert(report.reportMarkdown.includes('Nolan Josue Silva dos Santos'), 'Final Markdown should include extracted patient name.')
  assert(report.reportMarkdown.includes('Braulino Peixoto'), 'Final Markdown should include extracted responsible professional.')
}
