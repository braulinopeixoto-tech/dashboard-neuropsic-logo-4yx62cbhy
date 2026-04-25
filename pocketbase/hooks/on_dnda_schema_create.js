onRecordCreate((e) => {
  const record = e.record

  const neuroEnergy = record.getFloat('neuro_energy') || 0
  const networkIntegration = record.getFloat('network_integration') || 0
  const organization = record.getFloat('organization') || 0

  let cog = record.get('cognitive_function') || {}
  if (typeof cog === 'string') {
    try {
      cog = JSON.parse(cog)
    } catch (_) {
      cog = {}
    }
  }
  const cogValues = [
    parseFloat(cog.atencao_sustentada),
    parseFloat(cog.memoria_trabalho),
    parseFloat(cog.atencao_seletiva),
    parseFloat(cog.controle_inibitorio),
    parseFloat(cog.flexibilidade),
    parseFloat(cog.processamento_emocional),
  ].filter((v) => !isNaN(v))
  const cognitiveFunctionMedia = cogValues.length > 0 ? cogValues.reduce((a, b) => a + b, 0) / 6 : 0

  let temp = record.get('temporal_index') || {}
  if (typeof temp === 'string') {
    try {
      temp = JSON.parse(temp)
    } catch (_) {
      temp = {}
    }
  }
  const tempKeys = ['traumas', 'perdas', 'evolucao']
  const tempFilled = tempKeys.every((k) => temp[k] && String(temp[k]).trim() !== '')
  const temporalIndexScore = tempFilled ? 10 : 5

  const convergenceScore =
    (neuroEnergy * 0.25 +
      networkIntegration * 0.25 +
      organization * 0.2 +
      cognitiveFunctionMedia * 0.15 +
      temporalIndexScore * 0.15) *
    10
  record.set('convergence_score', convergenceScore)

  if (neuroEnergy < 4) {
    record.set('classification', 'hipoativo')
  } else if (neuroEnergy > 7) {
    record.set('classification', 'hiperativo')
  } else {
    record.set('classification', 'estável')
  }

  if (networkIntegration < 4) {
    record.set('integration_status', 'desacoplado')
  } else if (networkIntegration > 7) {
    record.set('integration_status', 'hiperacoplado')
  } else {
    record.set('integration_status', 'acoplado')
  }

  if (organization < 4) {
    record.set('organization_status', 'difuso')
  } else if (organization > 7) {
    record.set('organization_status', 'coerente')
  } else {
    record.set('organization_status', 'normal')
  }

  let riskLevel = 'moderado'
  if (convergenceScore < 30) riskLevel = 'alto'
  else if (convergenceScore > 70) riskLevel = 'baixo'
  record.set('risk_level', riskLevel)

  record.set(
    'dominant_pattern',
    `Padrão ${record.getString('classification')} com integração ${record.getString('integration_status')}.`,
  )
  record.set(
    'adaptive_vector',
    `Vetor de adaptação tendendo a ${record.getString('organization_status')}.`,
  )
  record.set(
    'clinical_justification',
    `Score de convergência: ${convergenceScore.toFixed(1)}. Risco clínico avaliado como ${riskLevel}.`,
  )

  if (convergenceScore < 30) record.set('intervention_priority', 9)
  else if (convergenceScore < 50) record.set('intervention_priority', 7)
  else record.set('intervention_priority', 3)

  e.next()
}, 'dnda_schema')
