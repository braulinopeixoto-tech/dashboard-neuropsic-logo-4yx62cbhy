onRecordAfterDeleteSuccess(
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

    const log = new Record(auditCol)
    const usuario_id = e.record.get('usuario_id')
    log.set('usuario_id', usuario_id)
    log.set('entity_type', entityType)
    log.set('entity_id', e.record.id)
    log.set('version', lastVersion + 1)
    log.set('timestamp', new Date().toISOString())
    log.set('author_id', usuario_id)
    log.set('action', 'delete')

    const oldVals = e.record.original().publicExport()
    log.set('old_values', oldVals)
    log.set('new_values', null)
    log.set('change_summary', `Exclusão de ${entityType}`)

    const hashStr =
      'delete' + entityType + e.record.id + (lastVersion + 1) + JSON.stringify(oldVals)
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
