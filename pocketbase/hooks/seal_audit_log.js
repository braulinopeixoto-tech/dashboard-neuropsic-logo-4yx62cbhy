routerAdd('POST', '/backend/v1/seal_audit_log', (e) => {
  if (!e.auth) {
    throw new UnauthorizedError('Não autorizado')
  }

  const body = e.requestInfo().body || {}

  if (!body.user_id || typeof body.user_id !== 'string' || body.user_id.trim() === '') {
    throw new BadRequestError('Campos obrigatórios faltando: user_id')
  }

  const validEvents = ['login', 'vital_score', 'acesso_prontuario']
  if (!body.event_type || !validEvents.includes(body.event_type)) {
    throw new BadRequestError('Campos obrigatórios faltando: event_type')
  }

  if (
    !body.action_description ||
    typeof body.action_description !== 'string' ||
    body.action_description.trim() === ''
  ) {
    throw new BadRequestError('Campos obrigatórios faltando: action_description')
  }

  try {
    let previous_hash = null
    let chain_position = 1

    try {
      const prevLogs = $app.findRecordsByFilter(
        'audit_logs',
        'usuario_id = {:userId}',
        '-created',
        1,
        0,
        { userId: body.user_id },
      )

      if (prevLogs && prevLogs.length > 0) {
        previous_hash = prevLogs[0].getString('hash_sha256') || null
        if (previous_hash === '') previous_hash = null

        try {
          const prevChain = $app.findRecordsByFilter(
            'hash_chain',
            'log_id = {:logId}',
            '-created',
            1,
            0,
            { logId: prevLogs[0].id },
          )
          if (prevChain && prevChain.length > 0) {
            chain_position = prevChain[0].getInt('chain_position') + 1
          }
        } catch (_) {}
      }
    } catch (_) {}

    const timestamp = new Date().toISOString()

    const payloadObj = {
      user_id: body.user_id,
      event_type: body.event_type,
      action_description: body.action_description,
      timestamp: timestamp,
      previous_hash: previous_hash,
    }

    const jsonString = JSON.stringify(payloadObj)
    const hash_sha256 = $security.sha256(jsonString)

    let log_id = ''

    $app.runInTransaction((txApp) => {
      const auditLogsCol = txApp.findCollectionByNameOrId('audit_logs')
      const logRecord = new Record(auditLogsCol)
      logRecord.set('usuario_id', body.user_id)
      logRecord.set('event_type', body.event_type)
      logRecord.set('action_description', body.action_description)
      if (body.payload) {
        logRecord.set('payload', body.payload)
      }
      logRecord.set('timestamp', timestamp)
      logRecord.set('hash_sha256', hash_sha256)
      logRecord.set('previous_hash', previous_hash === null ? '' : previous_hash)
      logRecord.set('integrity_status', 'pending')

      txApp.save(logRecord)
      log_id = logRecord.id

      const hashChainCol = txApp.findCollectionByNameOrId('hash_chain')
      const chainRecord = new Record(hashChainCol)
      chainRecord.set('log_id', log_id)
      chainRecord.set('current_hash', hash_sha256)
      chainRecord.set('previous_hash', previous_hash === null ? '' : previous_hash)
      chainRecord.set('chain_position', chain_position)

      txApp.save(chainRecord)
    })

    return e.json(200, {
      success: true,
      log_id: log_id,
      hash_sha256: hash_sha256,
      previous_hash: previous_hash,
      message: 'Log selado com sucesso',
    })
  } catch (err) {
    const errorId = $security.randomString(8)
    $app
      .logger()
      .error('Erro ao gerar hash.', 'errorId', errorId, 'error', err.message || err.toString())
    throw new InternalServerError('Erro ao gerar hash. Tente novamente.')
  }
})
