migrate(
  (app) => {
    const quickReports = app.findCollectionByNameOrId('quick_reports')

    let adminId
    try {
      const admin = app.findAuthRecordByEmail('users', 'braulinopeixoto@gmail.com')
      adminId = admin.id
    } catch (_) {
      return
    }

    let pacienteId
    try {
      const pacientes = app.findRecordsByFilter('pacientes', '', '', 1, 0)
      if (pacientes.length === 0) return
      pacienteId = pacientes[0].id
    } catch (_) {
      return
    }

    const reports = [
      {
        titulo: 'Observação Inicial - Protocolo REAC',
        conteudo:
          'Paciente apresenta boa resposta inicial ao estímulo, com redução de queixa de ansiedade.',
      },
      {
        titulo: 'Evolução de Sessão - tDCS',
        conteudo:
          'Sessão realizada sem intercorrências. Melhora na atenção sustentada relatada pelo paciente.',
      },
      {
        titulo: 'Acompanhamento Clínico',
        conteudo:
          'Adesão ao tratamento está em 90%. Paciente demonstra evolução constante nos índices de funcionalidade.',
      },
    ]

    for (const data of reports) {
      try {
        app.findFirstRecordByData('quick_reports', 'titulo', data.titulo)
      } catch (_) {
        const record = new Record(quickReports)
        record.set('usuario_id', adminId)
        record.set('paciente_id', pacienteId)
        record.set('titulo', data.titulo)
        record.set('conteudo', data.conteudo)
        app.save(record)
      }
    }
  },
  (app) => {
    const titulos = [
      'Observação Inicial - Protocolo REAC',
      'Evolução de Sessão - tDCS',
      'Acompanhamento Clínico',
      'Evolução Positiva TDAH',
    ]

    for (const titulo of titulos) {
      try {
        const record = app.findFirstRecordByData('quick_reports', 'titulo', titulo)
        app.delete(record)
      } catch (_) {}
    }
  },
)
