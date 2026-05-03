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

      const logUserId = logRecord.getString('usuario_id')
      const eventType = logRecord.getString('event_type')
      const actionDesc = logRecord.getString('action_description')
      const timestamp = logRecord.getString('timestamp')
      const prevHash = logRecord.getString('previous_hash')

      const rawString = `${logUserId}${eventType}${actionDesc}${timestamp}${prevHash}`
      const recalculatedHash = $security.sha256(rawString)
      const storedHash = logRecord.getString('hash_sha256')

      const isValid = recalculatedHash === storedHash
      const status = isValid ? 'valid' : 'corrupted'
      const now = new Date().toISOString()

      if (isValid) {
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
          message: 'Log íntegro',
        })
      } else {
        // Log is corrupted: trigger chain propagation logic
        let affectedCount = 0
        let lastCorruptedId = logRecord.id

        $app.runInTransaction((txApp) => {
          // 1. Mark current log as corrupted
          logRecord.set('integrity_status', 'corrupted')
          logRecord.set('verified_at', now)
          txApp.save(logRecord)
          affectedCount++

          try {
            const chainRecord = txApp.findFirstRecordByData('hash_chain', 'log_id', logId)
            chainRecord.set('verified_at', now)
            txApp.save(chainRecord)
          } catch (err) {}

          // 2. Propagate corruption through the chain to subsequent logs
          let currentHash = storedHash
          while (currentHash) {
            try {
              const nextLog = txApp.findFirstRecordByData(
                'audit_logs',
                'previous_hash',
                currentHash,
              )
              // If we reach the end of the chain or a log that's already corrupted, stop
              if (!nextLog || nextLog.getString('integrity_status') === 'corrupted') break

              nextLog.set('integrity_status', 'corrupted')
              nextLog.set('verified_at', now)
              txApp.save(nextLog)

              affectedCount++
              lastCorruptedId = nextLog.id
              currentHash = nextLog.getString('hash_sha256')
            } catch (err) {
              break // End of chain
            }
          }

          // 3. Create chain_breaks documentation record
          const chainBreaksCol = txApp.findCollectionByNameOrId('chain_breaks')
          const cbRecord = new Record(chainBreaksCol)
          cbRecord.set('usuario_id', e.auth.id)
          cbRecord.set('first_corrupted_log_id', logId)
          cbRecord.set('last_corrupted_log_id', lastCorruptedId)
          cbRecord.set('affected_logs_count', affectedCount)
          cbRecord.set('detected_at', now)
          cbRecord.set('status', 'detected')
          txApp.save(cbRecord)

          // 4. Create admin_alerts for all active administrators
          const admins = txApp.findRecordsByFilter('users', "tipo = 'neuropsicólogo'", '', 100, 0)
          for (const admin of admins) {
            const adminAlerts = txApp.findCollectionByNameOrId('admin_alerts')
            const alert = new Record(adminAlerts)
            alert.set('usuario_id', admin.id)
            alert.set('log_id', logId)
            alert.set('tipo_alerta', 'corrupted')
            alert.set(
              'mensagem',
              `ALERTA CRÍTICO: Quebra de cadeia detectada. ${affectedCount} logs afetados. Revisar imediatamente.`,
            )
            alert.set('lido', false)
            txApp.save(alert)

            // Simulate Security Notification System Delivery
            txApp
              .logger()
              .info(
                'EMAIL_SENT',
                'subject',
                'ALERTA DE SEGURANÇA: Quebra de cadeia de logs',
                'to',
                admin.getString('email'),
                'log_id',
                logId,
                'affected_count',
                affectedCount,
              )
          }
        })

        return e.json(200, {
          success: true,
          log_id: logId,
          integrity_status: 'corrupted',
          hash_stored: storedHash,
          hash_recalculated: recalculatedHash,
          verified_at: now,
          message: `ALERTA: Log corrompido! ${affectedCount} logs subsequentes também foram invalidados.`,
          affected_count: affectedCount,
        })
      }
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
