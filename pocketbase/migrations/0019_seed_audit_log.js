migrate(
  (app) => {
    const auditCol = app.findCollectionByNameOrId('audit_log')

    let adminId = ''
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
      adminId = admin.id
    } catch (err) {
      return
    }

    const dndaHash = $security.sha256('createDNDAdnda1231{"convergence_score":85}')
    const r1 = new Record(auditCol)
    r1.set('usuario_id', adminId)
    r1.set('entity_type', 'DNDA')
    r1.set('entity_id', 'dnda123')
    r1.set('version', 1)
    r1.set('timestamp', new Date().toISOString())
    r1.set('author_id', adminId)
    r1.set('action', 'create')
    r1.set('change_summary', 'Criação de DNDA')
    r1.set('new_values', { convergence_score: 85 })
    r1.set('hash_integrity', dndaHash)
    app.save(r1)

    const dndaUpdateHash = $security.sha256('updateDNDAdnda1232{"convergence_score":90}')
    const r2 = new Record(auditCol)
    r2.set('usuario_id', adminId)
    r2.set('entity_type', 'DNDA')
    r2.set('entity_id', 'dnda123')
    r2.set('version', 2)
    r2.set('timestamp', new Date().toISOString())
    r2.set('author_id', adminId)
    r2.set('action', 'update')
    r2.set('change_summary', 'Atualização de convergence_score')
    r2.set('old_values', { convergence_score: 85 })
    r2.set('new_values', { convergence_score: 90 })
    r2.set('hash_integrity', dndaUpdateHash)
    app.save(r2)

    const protoHash = $security.sha256('createprotocoloproto1231{"tipo":"REAC"}')
    const r3 = new Record(auditCol)
    r3.set('usuario_id', adminId)
    r3.set('entity_type', 'protocolo')
    r3.set('entity_id', 'proto123')
    r3.set('version', 1)
    r3.set('timestamp', new Date().toISOString())
    r3.set('author_id', adminId)
    r3.set('action', 'create')
    r3.set('change_summary', 'Criação de protocolo')
    r3.set('new_values', { tipo: 'REAC', total_sessoes: 10 })
    r3.set('hash_integrity', protoHash)
    app.save(r3)

    const sessHash = $security.sha256('updatesessaosess1232{"status":"realizada"}')
    const r4 = new Record(auditCol)
    r4.set('usuario_id', adminId)
    r4.set('entity_type', 'sessao')
    r4.set('entity_id', 'sess123')
    r4.set('version', 2)
    r4.set('timestamp', new Date().toISOString())
    r4.set('author_id', adminId)
    r4.set('action', 'update')
    r4.set('change_summary', 'Atualização de status')
    r4.set('old_values', { status: 'agendada' })
    r4.set('new_values', { status: 'realizada' })
    r4.set('hash_integrity', sessHash)
    app.save(r4)

    const intHash = $security.sha256('createintervencaoint1231{"tipo":"Contato telefônico"}')
    const r5 = new Record(auditCol)
    r5.set('usuario_id', adminId)
    r5.set('entity_type', 'intervencao')
    r5.set('entity_id', 'int123')
    r5.set('version', 1)
    r5.set('timestamp', new Date().toISOString())
    r5.set('author_id', adminId)
    r5.set('action', 'create')
    r5.set('change_summary', 'Criação de intervencao')
    r5.set('new_values', { tipo: 'Contato telefônico', descricao: 'Ligação para ajuste' })
    r5.set('hash_integrity', intHash)
    app.save(r5)
  },
  (app) => {
    const auditCol = app.findCollectionByNameOrId('audit_log')
    app.truncateCollection(auditCol)
  },
)
