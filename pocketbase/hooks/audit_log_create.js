onRecordAfterCreateSuccess(
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
    const log = new Record(auditCol)

    const usuario_id = e.record.get('usuario_id')
    log.set('usuario_id', usuario_id)
    log.set('entity_type', entityType)
    log.set('entity_id', e.record.id)
    log.set('version', 1)
    log.set('timestamp', new Date().toISOString())
    log.set('author_id', usuario_id)
    log.set('action', 'create')

    const newVals = e.record.publicExport()
    log.set('old_values', null)
    log.set('new_values', newVals)
    log.set('change_summary', `Criação de ${entityType}`)

    const hashStr = 'create' + entityType + e.record.id + '1' + JSON.stringify(newVals)
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
