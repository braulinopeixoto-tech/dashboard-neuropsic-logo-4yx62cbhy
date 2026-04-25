onRecordAfterUpdateSuccess(
  (e) => {
    const colName = e.collection.name
    let entityType = ''
    if (colName === 'dnda_schema') entityType = 'DNDA'
    else if (colName === 'protocolos') entityType = 'protocolo'
    else if (colName === 'sessoes') entityType = 'sessao'
    else if (colName === 'alertas') entityType = 'alerta'
    else if (colName === 'intervencoes') entityType = 'intervencao'
    else return e.next()

    const auditCol = $app.findCollectionByNameOrId('audit_log')

    let lastVersion = 0
    try {
      const records = $app.findRecordsByFilter(
        'audit_log',
        `entity_id = '${e.record.id}' && entity_type = '${entityType}'`,
        '-version',
        1,
        0,
      )
      if (records.length > 0) {
        lastVersion = records[0].getInt('version')
      }
    } catch (err) {}

    const currentVersion = lastVersion + 1

    const log = new Record(auditCol)
    const usuario_id = e.record.get('usuario_id')
    log.set('usuario_id', usuario_id)
    log.set('entity_type', entityType)
    log.set('entity_id', e.record.id)
    log.set('version', currentVersion)
    log.set('timestamp', new Date().toISOString())
    log.set('author_id', usuario_id)
    log.set('action', 'update')

    const oldValsExport = e.record.original().publicExport()
    const newValsExport = e.record.publicExport()

    const oldVals = {}
    const newVals = {}
    let changes = []

    for (let key in newValsExport) {
      if (key === 'updated' || key === 'created') continue
      if (JSON.stringify(oldValsExport[key]) !== JSON.stringify(newValsExport[key])) {
        oldVals[key] = oldValsExport[key]
        newVals[key] = newValsExport[key]
        changes.push(key)
      }
    }

    if (changes.length === 0) return e.next()

    log.set('old_values', oldVals)
    log.set('new_values', newVals)

    let changeMsg = `Atualização de ${changes.join(', ')}`
    if (changeMsg.length > 250) changeMsg = changeMsg.substring(0, 247) + '...'
    log.set('change_summary', changeMsg)

    const hashStr = 'update' + entityType + e.record.id + currentVersion + JSON.stringify(newVals)
    log.set('hash_integrity', $security.sha256(hashStr))

    $app.save(log)
    return e.next()
  },
  'dnda_schema',
  'protocolos',
  'sessoes',
  'alertas',
  'intervencoes',
)
