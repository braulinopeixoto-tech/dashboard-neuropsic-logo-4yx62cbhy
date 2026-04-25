onRecordAfterUpdateSuccess((e) => {
  const sessao = e.record
  const original = e.record.original()
  const usuarioId = sessao.getString('usuario_id')
  const pacienteId = sessao.getString('paciente_id')
  const protocoloId = sessao.getString('protocolo_id')

  let protocolo
  try {
    protocolo = $app.findRecordById('protocolos', protocoloId)
  } catch (err) {
    return e.next()
  }

  function createAlert(usr, pac, tipo, msg) {
    try {
      const alertas = $app.findCollectionByNameOrId('alertas')
      const alerta = new Record(alertas)
      alerta.set('usuario_id', usr)
      alerta.set('paciente_id', pac)
      alerta.set('tipo', tipo)
      alerta.set('mensagem', msg)
      alerta.set('lido', false)
      alerta.set('intervencao_realizada', false)
      $app.save(alerta)
    } catch (err) {
      $app.logger().error('Error generating alerta', 'error', err.message)
    }
  }

  // 1. Falta consecutiva
  if (sessao.getString('status') === 'faltou' && original.getString('status') !== 'faltou') {
    const lastTwo = $app.findRecordsByFilter(
      'sessoes',
      `protocolo_id='${protocoloId}'`,
      '-numero_sessao',
      2,
      0,
    )
    if (
      lastTwo.length === 2 &&
      lastTwo[0].getString('status') === 'faltou' &&
      lastTwo[1].getString('status') === 'faltou'
    ) {
      createAlert(
        usuarioId,
        pacienteId,
        'falta_consecutiva',
        `Falta consecutiva detectada na sessão ${sessao.getInt('numero_sessao')}`,
      )
    }
  }

  // 2. Pausa Excedida REAC > 15 dias
  if (sessao.getString('status') === 'realizada' && original.getString('status') !== 'realizada') {
    if (protocolo.getString('tipo') === 'REAC') {
      const prevSessoes = $app.findRecordsByFilter(
        'sessoes',
        `protocolo_id='${protocoloId}' && status='realizada' && id != '${sessao.id}'`,
        '-data_realizada',
        1,
        0,
      )
      if (
        prevSessoes.length > 0 &&
        prevSessoes[0].getString('data_realizada') &&
        sessao.getString('data_realizada')
      ) {
        const prevDate = new Date(prevSessoes[0].getString('data_realizada'))
        const currDate = new Date(sessao.getString('data_realizada'))
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24)
        if (diffDays > 15) {
          createAlert(
            usuarioId,
            pacienteId,
            'pausa_excedida',
            `Intervalo maior que 15 dias no protocolo REAC (${Math.floor(diffDays)} dias).`,
          )
        }
      }
    }
  }

  // 3. Risco de Desistência: Completion rate < 50% relative to expected duration
  const dataInicio = protocolo.getString('data_inicio')
  const dataFim = protocolo.getString('data_prevista_fim')
  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    const now = new Date()

    if (now > inicio) {
      let expectedRate = 1.0
      if (now < fim) {
        const totalDuration = fim.getTime() - inicio.getTime()
        const elapsed = now.getTime() - inicio.getTime()
        expectedRate = elapsed / totalDuration
      }

      const sessoesConcluidas = protocolo.getInt('sessoes_concluidas')
      const totalSessoes = protocolo.getInt('total_sessoes')
      const actualRate = totalSessoes > 0 ? sessoesConcluidas / totalSessoes : 0

      if (actualRate < expectedRate * 0.5) {
        const recentAlerts = $app.findRecordsByFilter(
          'alertas',
          `paciente_id='${pacienteId}' && tipo='risco_desistência'`,
          '-created',
          1,
          0,
        )
        let shouldAlert = true
        if (recentAlerts.length > 0) {
          const lastAlertDate = new Date(recentAlerts[0].getString('created'))
          const daysSinceLastAlert = (now - lastAlertDate) / (1000 * 60 * 60 * 24)
          if (daysSinceLastAlert < 7) shouldAlert = false
        }
        if (shouldAlert) {
          createAlert(
            usuarioId,
            pacienteId,
            'risco_desistência',
            `Atraso significativo no protocolo. Concluído: ${Math.round(actualRate * 100)}%, Esperado: ${Math.round(expectedRate * 100)}%`,
          )
        }
      }
    }
  }

  e.next()
}, 'sessoes')
