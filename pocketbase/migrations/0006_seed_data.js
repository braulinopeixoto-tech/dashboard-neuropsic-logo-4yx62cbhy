migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const emails = [
      {
        email: 'braulinopeixoto@gmail.com',
        name: 'Dr. Braulino',
        tipo: 'neuropsicólogo',
        unidade: 'Cidade A',
      },
      {
        email: 'assistente@clinica.com',
        name: 'Ana (Assistente)',
        tipo: 'assistente_líder',
        unidade: 'Cidade A',
      },
      {
        email: 'neuro@clinica.com',
        name: 'Carla (Neuro)',
        tipo: 'neuromoduladora',
        unidade: 'Cidade B',
      },
    ]

    let adminId = ''

    for (const u of emails) {
      try {
        const existing = app.findAuthRecordByEmail('_pb_users_auth_', u.email)
        if (u.email === 'braulinopeixoto@gmail.com') adminId = existing.id
      } catch (_) {
        const record = new Record(users)
        record.setEmail(u.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', u.name)
        record.set('tipo', u.tipo)
        record.set('unidade', u.unidade)
        record.set('ativo', true)
        app.save(record)
        if (u.email === 'braulinopeixoto@gmail.com') adminId = record.id
      }
    }

    const pacientesCol = app.findCollectionByNameOrId('pacientes')
    const protocolosCol = app.findCollectionByNameOrId('protocolos')
    const sessoesCol = app.findCollectionByNameOrId('sessoes')
    const alertasCol = app.findCollectionByNameOrId('alertas')

    const pts = [
      { nome: 'Ricardo Oliveira', email: 'ricardo@mail.com', telefone: '11999999991' },
      { nome: 'Ana Souza', email: 'ana@mail.com', telefone: '11999999992' },
      { nome: 'Bruno Pereira', email: 'bruno@mail.com', telefone: '11999999993' },
      { nome: 'Carla Mendes', email: 'carla@mail.com', telefone: '11999999994' },
      { nome: 'Diego Costa', email: 'diego@mail.com', telefone: '11999999995' },
    ]

    for (let idx = 0; idx < pts.length; idx++) {
      const pt = pts[idx]
      try {
        app.findFirstRecordByData('pacientes', 'email', pt.email)
      } catch (_) {
        const pRec = new Record(pacientesCol)
        pRec.set('usuario_id', adminId)
        pRec.set('nome', pt.nome)
        pRec.set('email', pt.email)
        pRec.set('telefone', pt.telefone)
        pRec.set('unidade', 'Cidade A')
        pRec.set('ativo', true)
        app.save(pRec)

        const isReac = idx < 2
        const protRec = new Record(protocolosCol)
        protRec.set('usuario_id', adminId)
        protRec.set('paciente_id', pRec.id)
        protRec.set('tipo', isReac ? 'REAC' : 'tDCS')
        protRec.set('total_sessoes', 18)
        protRec.set('sessoes_concluidas', idx * 2 + 1)
        protRec.set('status', 'ativo')
        app.save(protRec)

        for (let i = 1; i <= 3; i++) {
          const sessRec = new Record(sessoesCol)
          sessRec.set('usuario_id', adminId)
          sessRec.set('paciente_id', pRec.id)
          sessRec.set('protocolo_id', protRec.id)
          sessRec.set('numero_sessao', i)

          let sStatus = 'agendada'
          if (i === 1) sStatus = 'realizada'
          if (i === 2 && idx === 0) sStatus = 'faltou'

          sessRec.set('status', sStatus)

          const d = new Date()
          if (sStatus === 'realizada') {
            d.setDate(d.getDate() - 5 + i)
            sessRec.set('data_realizada', d.toISOString())
          } else if (sStatus === 'faltou') {
            d.setDate(d.getDate() - 1)
            sessRec.set('data_agendada', d.toISOString())
          } else {
            d.setDate(d.getDate() + i)
            sessRec.set('data_agendada', d.toISOString())
          }
          app.save(sessRec)
        }

        if (idx === 0) {
          const altRec = new Record(alertasCol)
          altRec.set('usuario_id', adminId)
          altRec.set('paciente_id', pRec.id)
          altRec.set('tipo', 'risco_desistência')
          altRec.set('mensagem', 'Falta consecutiva detectada.')
          altRec.set('lido', false)
          app.save(altRec)
        }
        if (idx === 1) {
          const altRec = new Record(alertasCol)
          altRec.set('usuario_id', adminId)
          altRec.set('paciente_id', pRec.id)
          altRec.set('tipo', 'pausa_excedida')
          altRec.set('mensagem', 'Pausa excedida entre sessões.')
          altRec.set('lido', false)
          app.save(altRec)
        }
      }
    }
  },
  (app) => {},
)
