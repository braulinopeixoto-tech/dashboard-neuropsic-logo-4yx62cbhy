migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUsers = [
      { name: 'Ana Silva', email: 'ana.silva@example.com', tipo: 'neuropsicólogo' },
      { name: 'Carlos Oliveira', email: 'carlos.oliveira@example.com', tipo: 'assistente_líder' },
      { name: 'Mariana Santos', email: 'mariana.santos@example.com', tipo: 'neuromoduladora' },
    ]

    const createdUsers = []
    for (const u of seedUsers) {
      let user
      try {
        user = app.findAuthRecordByEmail('_pb_users_auth_', u.email)
      } catch (_) {
        user = new Record(usersCol)
        user.setEmail(u.email)
        user.setPassword('Skip@Pass123')
        user.setVerified(true)
        user.set('name', u.name)
        user.set('tipo', u.tipo)
        app.save(user)
      }
      createdUsers.push(user)
    }

    const auditLogsCol = app.findCollectionByNameOrId('audit_logs')
    const hashChainCol = app.findCollectionByNameOrId('hash_chain')

    try {
      const existing = app.findFirstRecordByData(
        'audit_logs',
        'action_description',
        'Log de Teste 1',
      )
      if (existing) return // already seeded
    } catch (_) {}

    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000'
    const events = ['login', 'vital_score', 'acesso_prontuario']
    const statuses = [
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'valid',
      'pending',
      'pending',
      'corrupted',
    ]

    for (let i = 0; i < 15; i++) {
      const u = createdUsers[i % 3]
      const status = statuses[i]
      const payloadObj = { iter: i, action: events[i % 3], status: 'success' }
      const payloadStr = JSON.stringify(payloadObj)

      let currentHash = $security.sha256(prevHash + payloadStr + i)

      if (status === 'corrupted') {
        currentHash = $security.sha256('corrupted_data_' + i)
      }

      const log = new Record(auditLogsCol)
      log.set('usuario_id', u.id)
      log.set('event_type', events[i % 3])
      log.set('action_description', 'Log de Teste ' + (i + 1))
      log.set('payload', payloadObj)

      const d = new Date()
      d.setMinutes(d.getMinutes() - (15 - i) * 60)
      const isoDate = d.toISOString().replace('T', ' ').replace('Z', 'Z')

      log.set('timestamp', isoDate)
      log.set('hash_sha256', currentHash)
      log.set('previous_hash', prevHash)
      log.set('integrity_status', status)

      app.save(log)

      const chain = new Record(hashChainCol)
      chain.set('log_id', log.id)
      chain.set('current_hash', currentHash)
      chain.set('previous_hash', prevHash)
      chain.set('chain_position', i + 1)
      if (status === 'valid') {
        chain.set('verified_at', isoDate)
      }
      app.save(chain)

      prevHash = currentHash
    }
  },
  (app) => {
    try {
      const logs = app.findRecordsByFilter(
        'audit_logs',
        "action_description ~ 'Log de Teste'",
        '',
        100,
        0,
      )
      for (const log of logs) {
        app.delete(log)
      }
    } catch (_) {}
  },
)
