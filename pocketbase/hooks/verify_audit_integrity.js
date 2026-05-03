routerAdd(
  'POST',
  '/backend/v1/verify-integrity',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const logId = body.log_id

      if (
        !logId ||
        typeof logId !== 'string' ||
        (!logId.match(/^[a-zA-Z0-9]{15}$/) &&
          !logId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
      ) {
        return e.json(400, { success: false, error: 'log_id inválido ou ausente' })
      }

      let logRecord
      try {
        logRecord = $app.findRecordById('audit_logs', logId)
      } catch (err) {
        return e.json(404, { success: false, error: 'Log não encontrado' })
      }

      const userId = logRecord.getString('usuario_id')
      const eventType = logRecord.getString('event_type')
      const actionDesc = logRecord.getString('action_description')
      const timestamp = logRecord.getString('timestamp')
      const prevHash = logRecord.getString('previous_hash')

      const rawString = `${userId}${eventType}${actionDesc}${timestamp}${prevHash}`
      const recalculatedHash = $security.sha256(rawString)
      const storedHash = logRecord.getString('hash_sha256')

      const isValid = recalculatedHash === storedHash
      const status = isValid ? 'valid' : 'corrupted'
      const now = new Date().toISOString()

      logRecord.set('integrity_status', status)
      logRecord.set('verified_at', now)
      $app.save(logRecord)

      try {
        const chainRecord = $app.findFirstRecordByData('hash_chain', 'log_id', logId)
        chainRecord.set('verified_at', now)
        $app.save(chainRecord)
      } catch (err) {
        // Ignore if hash_chain record doesn't exist
      }

      return e.json(200, {
        success: true,
        log_id: logId,
        integrity_status: status,
        hash_stored: storedHash,
        hash_recalculated: recalculatedHash,
        verified_at: now,
        message: isValid ? 'Log íntegro' : 'ALERTA: Log corrompido ou alterado!',
      })
    } catch (err) {
      $app.logger().error('Erro na verificação de integridade', 'error', err.message)
      return e.json(500, {
        success: false,
        error: 'Erro ao verificar integridade. Tente novamente.',
      })
    }
  },
  $apis.requireAuth(),
)
