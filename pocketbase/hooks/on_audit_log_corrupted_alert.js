onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const original = record.original()

  if (
    record.getString('integrity_status') === 'corrupted' &&
    original.getString('integrity_status') !== 'corrupted'
  ) {
    // Find all admin users (neuropsicólogos)
    const admins = $app.findRecordsByFilter('users', "tipo = 'neuropsicólogo'", '', 100, 0)

    // Create an alert for each admin
    for (const admin of admins) {
      const adminAlerts = $app.findCollectionByNameOrId('admin_alerts')
      const alert = new Record(adminAlerts)
      alert.set('usuario_id', admin.id)
      alert.set('log_id', record.id)
      alert.set('tipo_alerta', 'corrupted')
      alert.set(
        'mensagem',
        `Log de auditoria corrompido detectado para evento ${record.getString('event_type')}. Revisar dashboard de compliance.`,
      )
      alert.set('lido', false)
      $app.save(alert)

      // Simulate Email & SMS (v2 Security Notification System)
      $app
        .logger()
        .info(
          'EMAIL_SENT',
          'subject',
          'ALERTA DE SEGURANÇA: Log corrompido detectado',
          'to',
          admin.getString('email'),
          'log_id',
          record.id,
          'event_type',
          record.getString('event_type'),
        )
      $app
        .logger()
        .info(
          'SMS_SENT',
          'message',
          'ALERTA: Log corrompido. Revisar dashboard.',
          'to',
          admin.getString('telefone') || 'unknown',
        )
    }
  }

  e.next()
}, 'audit_logs')
