import { runQuickReportFromRawText } from '@/services/quick-report-engine-adapter'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const rawNolanReport = `
# RELATÓRIO NEUROPSICOLÓGICO

**Paciente:** NOLAN JOSUE SILVA DOS SANTOS
**Idade:** 4 anos
**Município:** Lençóis
**Responsável Técnico:** Braulino Peixoto

## HISTÓRICO CLÍNICO E DO NEURODESENVOLVIMENTO
Atraso de fala e sono irregular.

## COMUNICAÇÃO E LINGUAGEM
Ecolalia e dificuldade de comunicação social.

## COMPORTAMENTOS RESTRITIVOS E REPETITIVOS
Rigidez e padrões repetitivos.

## INTEGRAÇÃO SENSORIAL
Seletividade alimentar e hipersensibilidade tátil.

## ANÁLISE NEUROFUNCIONAL / qEEG
Alpha 9,28 Hz em O1.
Alpha 11,23 Hz em O1, Cz e Fz.
Theta 7,08 Hz em Fz e Cz.
Theta 4,39 Hz em Cz.

## COORDENADA NEUROFUNCIONAL
Área de Broca e córtex frontal inferior esquerdo.
`

export function runQuickReportUiAdapterTests(): void {
  const { parsedInput, result } = runQuickReportFromRawText(rawNolanReport, 'clinical')

  assert(parsedInput.patient.name === 'NOLAN JOSUE SILVA DOS SANTOS', 'Adapter should extract Nolan name.')
  assert(parsedInput.patient.age === '4 anos', 'Adapter should extract age.')
  assert(parsedInput.patient.city === 'Lençóis', 'Adapter should extract city.')
  assert(parsedInput.responsibleProfessional === 'Braulino Peixoto', 'Adapter should extract responsible professional.')

  assert(parsedInput.qeeg?.frequencyHz?.includes(9.28), 'Adapter should extract alpha 9.28 Hz.')
  assert(parsedInput.qeeg?.frequencyHz?.includes(11.23), 'Adapter should extract alpha 11.23 Hz.')
  assert(parsedInput.qeeg?.frequencyHz?.includes(7.08), 'Adapter should extract theta 7.08 Hz.')
  assert(parsedInput.qeeg?.frequencyHz?.includes(4.39), 'Adapter should extract theta 4.39 Hz.')
  assert(parsedInput.qeeg?.bands?.includes('alpha'), 'Adapter should extract alpha band.')
  assert(parsedInput.qeeg?.bands?.includes('theta'), 'Adapter should extract theta band.')
  assert(parsedInput.qeeg?.location10_20?.some((location) => location.includes('O1')), 'Adapter should extract O1 location.')
  assert(parsedInput.qeeg?.location10_20?.some((location) => location.includes('Cz') && location.includes('Fz')), 'Adapter should extract Cz/Fz locations.')

  assert(parsedInput.sourceLocalization?.regions?.includes('cortex frontal inferior esquerdo'), 'Adapter should extract Broca source region.')
  assert(parsedInput.sourceLocalization?.brodmannAreas?.includes('BA44'), 'Adapter should infer BA44.')
  assert(parsedInput.sourceLocalization?.brodmannAreas?.includes('BA45'), 'Adapter should infer BA45.')

  assert(result.reportMarkdown.includes('Grau de Convergencia Clinica'), 'Report Markdown should show clinical convergence score.')
  assert(!result.reportMarkdown.includes('3500%'), 'Report Markdown should not show 3500%.')
  assert(!result.reportMarkdown.includes('# RELATÓRIO NEUROPSICOLÓGICO'), 'Raw Markdown titles should not become clinical findings.')
}
