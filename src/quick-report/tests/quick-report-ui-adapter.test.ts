import { runQuickReportFromRawText } from '../../services/quick-report-engine-adapter'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const rawNolanReport = `
# RELATÓRIO NEUROPSICOLÓGICO

**Paciente:** NOLAN JOSUE SILVA DOS SANTOS
**Idade:** 4 anos
**Município:** Lençóis
**Responsável Técnico:** Braulino Peixoto
**Finalidade do Documento:** rastreamento clínico neurofuncional

---

## HISTÓRICO CLÍNICO E DO NEURODESENVOLVIMENTO
Atraso de fala observado desde o desenvolvimento inicial.
Sono irregular com oscilação de regulação.

## COMUNICAÇÃO E LINGUAGEM
Ecolalia e dificuldade de comunicação social.

## INTERAÇÃO SOCIAL
Dificuldade social em interações espontâneas.

## COMPORTAMENTOS RESTRITIVOS E REPETITIVOS
Rigidez comportamental e padrões repetitivos.

## INTEGRAÇÃO SENSORIAL
Seletividade alimentar e hipersensibilidade tátil.

## ANÁLISE NEUROFUNCIONAL / qEEG
Alpha 9,28 Hz em O1.
Alpha 11,23 Hz em O1, Cz e Fz.
Theta 7,08 Hz em Fz e Cz.
Theta 4,39 Hz em Cz.
Potência: 2 mV.

## COORDENADA NEUROFUNCIONAL
Área de Broca e córtex frontal inferior esquerdo.
BA44 e BA45.

## RECOMENDAÇÕES
Recomenda-se correlação clínica e acompanhamento multiprofissional.
`

export function runQuickReportUiAdapterTests(): void {
  const { parsedInput, result } = runQuickReportFromRawText(rawNolanReport, 'clinical')

  assert(
    parsedInput.patient.name === 'NOLAN JOSUE SILVA DOS SANTOS',
    'Adapter deve extrair o nome do paciente Nolan.',
  )
  assert(parsedInput.patient.age === '4 anos', 'Adapter deve extrair idade de 4 anos.')
  assert(parsedInput.patient.city === 'Lençóis', 'Adapter deve extrair município Lençóis.')
  assert(
    parsedInput.responsibleProfessional === 'Braulino Peixoto',
    'Adapter deve extrair responsável técnico Braulino Peixoto.',
  )

  assert(parsedInput.qeeg?.frequencyHz?.includes(9.28), 'qEEG deve extrair alpha 9.28 Hz.')
  assert(parsedInput.qeeg?.frequencyHz?.includes(11.23), 'qEEG deve extrair alpha 11.23 Hz.')
  assert(parsedInput.qeeg?.frequencyHz?.includes(7.08), 'qEEG deve extrair theta 7.08 Hz.')
  assert(parsedInput.qeeg?.frequencyHz?.includes(4.39), 'qEEG deve extrair theta 4.39 Hz.')
  assert(parsedInput.qeeg?.bands?.includes('alpha'), 'qEEG deve extrair banda alpha.')
  assert(parsedInput.qeeg?.bands?.includes('theta'), 'qEEG deve extrair banda theta.')
  assert(parsedInput.qeeg?.location10_20?.includes('O1'), 'qEEG deve extrair O1.')
  assert(parsedInput.qeeg?.location10_20?.includes('Cz'), 'qEEG deve extrair Cz.')
  assert(parsedInput.qeeg?.location10_20?.includes('Fz'), 'qEEG deve extrair Fz.')

  assert(
    parsedInput.sourceLocalization?.regions?.includes('córtex frontal inferior esquerdo'),
    'Área de Broca deve virar região córtex frontal inferior esquerdo.',
  )
  assert(
    parsedInput.sourceLocalization?.brodmannAreas?.includes('BA44'),
    'Área de Broca deve mapear BA44.',
  )
  assert(
    parsedInput.sourceLocalization?.brodmannAreas?.includes('BA45'),
    'Área de Broca deve mapear BA45.',
  )

  assert(
    result.riskLevel === 'moderate' || result.riskLevel === 'high',
    'Criança de 4 anos com múltiplos marcadores neurodesenvolvimentais deve ter risco ao menos moderado.',
  )
  assert(
    result.reportMarkdown.includes('Grau de Convergencia Clinica'),
    'Markdown deve conter Grau de Convergencia Clinica.',
  )
  assert(!result.reportMarkdown.includes('3500%'), 'Markdown não pode renderizar 3500%.')
  assert(
    !result.reportMarkdown.includes('# RELATÓRIO NEUROPSICOLÓGICO'),
    'Títulos markdown do texto bruto não devem virar achados clínicos.',
  )
}
