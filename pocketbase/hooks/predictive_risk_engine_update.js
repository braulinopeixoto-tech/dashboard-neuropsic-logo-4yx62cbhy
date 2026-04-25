onRecordAfterUpdateSuccess(
  (e) => {
    try {
      const colName = e.collection.name
      let pacienteId = e.record.get('paciente_id')
      let protocoloId = null

      if (colName === 'sessoes') {
        protocoloId = e.record.get('protocolo_id')
      } else if (colName === 'protocolos') {
        protocoloId = e.record.id
      } else if (colName === 'dnda_schema') {
        try {
          const activeProt = $app.findFirstRecordByFilter(
            'protocolos',
            `paciente_id = '${pacienteId}' && status = 'ativo'`,
          )
          protocoloId = activeProt.id
        } catch (_) {
          return e.next()
        }
      }

      if (!protocoloId || !pacienteId) return e.next()

      const usuarioId = e.record.get('usuario_id')

      let protocolo
      try {
        protocolo = $app.findRecordById('protocolos', protocoloId)
      } catch (_) {
        return e.next()
      }

      const totalSessoes = protocolo.getFloat('total_sessoes') || 1
      const sessoes = $app.findRecordsByFilter(
        'sessoes',
        `protocolo_id = '${protocoloId}'`,
        'data_agendada',
        1000,
        0,
      )

      let faltas = 0
      let realizadas = 0
      let lastSessaoDate = null
      let faltasConsecutivas = 0
      let checkFaltas = true

      for (let i = sessoes.length - 1; i >= 0; i--) {
        const status = sessoes[i].getString('status')
        if (status === 'faltou') {
          faltas++
          if (checkFaltas) faltasConsecutivas++
        } else if (status === 'realizada') {
          realizadas++
          checkFaltas = false
          if (!lastSessaoDate) {
            lastSessaoDate = new Date(
              sessoes[i].getString('data_realizada') || sessoes[i].getString('data_agendada'),
            )
          }
        } else if (status === 'agendada') {
          // ignore
        } else {
          checkFaltas = false
        }
      }

      let dndaScore = 0
      try {
        const dnda = $app.findFirstRecordByFilter(
          'dnda_schema',
          `paciente_id = '${pacienteId}'`,
          '-created',
        )
        dndaScore = dnda.getFloat('convergence_score')
      } catch (_) {}

      let performanceScore = 0
      if (dndaScore > 70) performanceScore = 85
      else if (dndaScore >= 30) performanceScore = 65
      else if (dndaScore > 0) performanceScore = 30

      const adherenceScore = Math.min(100, Math.round((realizadas / totalSessoes) * 100))

      let daysSinceLast = 0
      if (lastSessaoDate) {
        daysSinceLast = Math.floor((new Date() - lastSessaoDate) / (1000 * 60 * 60 * 24))
      } else {
        const startStr = protocolo.getString('data_inicio') || protocolo.getString('created')
        daysSinceLast = Math.floor((new Date() - new Date(startStr)) / (1000 * 60 * 60 * 24))
      }
      if (daysSinceLast < 0) daysSinceLast = 0

      let abandonmentRisk = 0
      let alertLevel = 'baixo'
      let alertMessage = ''
      let recommendation = ''

      if (faltasConsecutivas > 2 || (faltas > 2 && daysSinceLast > 10)) {
        abandonmentRisk = 85
        alertLevel = 'crítico'
        alertMessage =
          'Crítico: Paciente com 85% de risco de abandono. Intervalo de ' +
          daysSinceLast +
          ' dias sem sessão.'
        recommendation = 'Contato telefônico urgente + remarcação automática'
      } else if (faltasConsecutivas === 2 || (faltas === 2 && daysSinceLast === 10)) {
        abandonmentRisk = 70
        alertLevel = 'alto'
        alertMessage = 'Alto: Paciente com 2 faltas consecutivas. Recomenda-se contato imediato.'
        recommendation = 'Contato via WhatsApp + oferecer horário alternativo'
      } else if (
        faltasConsecutivas === 1 ||
        (faltas === 1 && daysSinceLast < 10) ||
        adherenceScore < 50
      ) {
        abandonmentRisk = 45
        alertLevel = 'moderado'
        alertMessage =
          'Moderado: Aderência em ' + adherenceScore + '%. Acompanhar próximas sessões.'
        recommendation = 'Enviar lembrete 24h antes da próxima sessão'
      } else {
        abandonmentRisk = 10
        alertLevel = 'baixo'
        alertMessage = 'Baixo: Paciente em dia com protocolo.'
        recommendation = 'Continuar acompanhamento normal'
      }

      let riskRecord
      try {
        riskRecord = $app.findFirstRecordByFilter('risk_score', `protocolo_id = '${protocoloId}'`)
      } catch (_) {
        const riskCol = $app.findCollectionByNameOrId('risk_score')
        riskRecord = new Record(riskCol)
        riskRecord.set('usuario_id', usuarioId)
        riskRecord.set('paciente_id', pacienteId)
        riskRecord.set('protocolo_id', protocoloId)
      }

      riskRecord.set('timestamp', new Date().toISOString())
      riskRecord.set('abandonment_risk', abandonmentRisk)
      riskRecord.set('adherence_score', adherenceScore)
      riskRecord.set('performance_score', performanceScore)
      riskRecord.set('alert_level', alertLevel)
      riskRecord.set('alert_message', alertMessage)
      riskRecord.set('recommendation', recommendation)

      $app.save(riskRecord)
    } catch (err) {
      $app.logger().error('risk engine update failed', 'err', err)
    }
    return e.next()
  },
  'sessoes',
  'dnda_schema',
  'protocolos',
)
