onRecordAfterUpdateSuccess((e) => {
  const oldScore = e.record.original().getFloat('convergence_score')
  const newScore = e.record.getFloat('convergence_score')

  if (oldScore !== newScore) {
    const logCol = $app.findCollectionByNameOrId('convergence_log')
    const logRecord = new Record(logCol)
    logRecord.set('usuario_id', e.record.get('usuario_id'))
    logRecord.set('dnda_id', e.record.id)
    logRecord.set('convergence_score_old', oldScore)
    logRecord.set('convergence_score_new', newScore)
    logRecord.set('change_reason', 'Atualização do DNDA via sistema')
    logRecord.set('timestamp', new Date().toISOString())

    $app.save(logRecord)
  }

  e.next()
}, 'dnda_schema')
