onRecordAfterUpdateSuccess((e) => {
  const sessao = e.record
  const original = e.record.original()

  if (sessao.getString('status') === 'faltou' && original.getString('status') !== 'faltou') {
    const sessoes = $app.findRecordsByFilter(
      'sessoes',
      `protocolo_id='${sessao.getString('protocolo_id')}' && status='faltou'`,
      '-numero_sessao',
      2,
      0,
    )

    if (sessoes.length >= 2) {
      try {
        const alertas = $app.findCollectionByNameOrId('alertas')
        const alerta = new Record(alertas)
        alerta.set('usuario_id', sessao.getString('usuario_id'))
        alerta.set('paciente_id', sessao.getString('paciente_id'))
        alerta.set('tipo', 'falta_consecutiva')
        alerta.set(
          'mensagem',
          `Falta consecutiva detectada na sessão ${sessao.getInt('numero_sessao')}`,
        )
        alerta.set('lido', false)
        $app.save(alerta)
      } catch (err) {
        $app.logger().error('Error generating alerta', 'error', err.message)
      }
    }
  }
}, 'sessoes')
