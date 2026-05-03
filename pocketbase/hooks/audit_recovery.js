routerAdd(
  'POST',
  '/backend/v1/audit/recover',
  (e) => {
    const body = e.requestInfo().body
    const breakId = body.break_id
    const action = body.action
    const notes = body.notes || ''

    if (!e.auth || e.auth.getString('tipo') !== 'neuropsicólogo') {
      return e.forbiddenError('Apenas administradores podem realizar esta ação.')
    }

    const chainBreak = $app.findRecordById('chain_breaks', breakId)
    const affectedCount = chainBreak.getInt('affected_logs_count')
    const firstLogId = chainBreak.getString('first_corrupted_log_id')
    const lastLogId = chainBreak.getString('last_corrupted_log_id')

    if (action === 'delecao') {
      const firstLog = $app.findRecordById('audit_logs', firstLogId)
      const lastLog = $app.findRecordById('audit_logs', lastLogId)

      const logsToDelete = $app.findRecordsByFilter(
        'audit_logs',
        'timestamp >= {:t1} && timestamp <= {:t2}',
        'timestamp',
        10000,
        0,
        { t1: firstLog.getString('timestamp'), t2: lastLog.getString('timestamp') },
      )

      for (let i = 0; i < logsToDelete.length; i++) {
        $app.delete(logsToDelete[i])
      }
    }

    // Revalidate entire chain to ensure valid state
    const allLogs = $app.findRecordsByFilter('audit_logs', '1=1', 'timestamp', 10000, 0)
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000'

    for (let i = 0; i < allLogs.length; i++) {
      const l = allLogs[i]
      const payloadObj = l.get('payload') || {}
      const payloadStr = JSON.stringify(payloadObj)
      const rawData =
        l.getString('event_type') +
        l.getString('usuario_id') +
        l.getString('timestamp') +
        payloadStr +
        prevHash
      const newHash = $security.sha256(rawData)

      l.set('previous_hash', prevHash)
      l.set('hash_sha256', newHash)
      l.set('integrity_status', 'valid')
      l.set('verified_at', new Date().toISOString())
      $app.saveNoValidate(l)

      prevHash = newHash
    }

    // Update chain_break
    chainBreak.set('status', action === 'investigacao' ? 'investigated' : 'resolved')
    $app.save(chainBreak)

    // Mark all other detected breaks as resolved if we just fixed the chain
    if (action !== 'investigacao') {
      const otherBreaks = $app.findRecordsByFilter(
        'chain_breaks',
        "status = 'detected' || status = 'investigating'",
        'created',
        100,
        0,
      )
      for (let i = 0; i < otherBreaks.length; i++) {
        const b = otherBreaks[i]
        if (b.id !== chainBreak.id) {
          b.set('status', 'resolved')
          $app.save(b)
        }
      }
    }

    // Create recovery_report
    const reportsCol = $app.findCollectionByNameOrId('recovery_reports')
    const report = new Record(reportsCol)
    report.set('usuario_id', e.auth.id)
    report.set('chain_break_id', breakId)
    report.set('acao_tomada', action)
    report.set('logs_afetados', affectedCount)
    report.set('notas_investigacao', notes)
    report.set('timestamp_resolucao', new Date().toISOString())
    $app.save(report)

    // Create Audit Log for this recovery
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const audit = new Record(auditCol)
    audit.set('usuario_id', e.auth.id)
    audit.set('event_type', 'acesso_prontuario')
    audit.set('action_description', 'Recuperacao de logs: ' + action)
    audit.set('timestamp', new Date().toISOString())
    audit.set('integrity_status', 'valid')
    audit.set('verified_at', new Date().toISOString())

    const rawAudit =
      'acesso_prontuario' + e.auth.id + audit.getString('timestamp') + '{}' + prevHash
    const auditHash = $security.sha256(rawAudit)
    audit.set('previous_hash', prevHash)
    audit.set('hash_sha256', auditHash)
    $app.saveNoValidate(audit)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
