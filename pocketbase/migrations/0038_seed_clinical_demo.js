migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const pacientes = app.findCollectionByNameOrId('pacientes')
    const protocolos = app.findCollectionByNameOrId('protocolos')
    const sessoes = app.findCollectionByNameOrId('sessoes')
    const alertas = app.findCollectionByNameOrId('alertas')
    let quickReports
    try {
      quickReports = app.findCollectionByNameOrId('quick_reports')
    } catch (_) {}

    let adminId
    try {
      const admin = app.findAuthRecordByEmail('users', 'braulinopeixoto@gmail.com')
      adminId = admin.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('braulinopeixoto@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin Neuro')
      record.set('tipo', 'neuropsicólogo')
      record.set('unidade', 'Unidade Centro')
      app.save(record)
      adminId = record.id
    }

    const demoPacientes = [
      {
        nome: 'Carlos Eduardo Mendes',
        email: 'carlos.m@example.com',
        unidade: 'Unidade Centro',
        documento: '11122233344',
        endereco: 'Rua das Flores, 123',
        telefone: '11999998888',
        queixa_principal: 'Ansiedade e insônia',
        data_nascimento: '1980-05-12 12:00:00.000Z',
      },
      {
        nome: 'Mariana Costa Silva',
        email: 'mariana.c@example.com',
        unidade: 'Unidade Sul',
        documento: '22233344455',
        endereco: 'Av Paulista, 1000',
        telefone: '11988887777',
        queixa_principal: 'Depressão resistente',
        data_nascimento: '1992-08-25 12:00:00.000Z',
      },
      {
        nome: 'Roberto Alves',
        email: 'roberto.a@example.com',
        unidade: 'Unidade Norte',
        documento: '33344455566',
        endereco: 'Rua Augusta, 500',
        telefone: '11977776666',
        queixa_principal: 'TDAH e fadiga mental',
        data_nascimento: '1975-11-03 12:00:00.000Z',
      },
      {
        nome: 'Fernanda Lima',
        email: 'fernanda.l@example.com',
        unidade: 'Unidade Centro',
        documento: '44455566677',
        endereco: 'Rua Oscar Freire, 200',
        telefone: '11966665555',
        queixa_principal: 'Fibromialgia',
        data_nascimento: '1988-02-15 12:00:00.000Z',
      },
      {
        nome: 'João Pedro Santos',
        email: 'joao.p@example.com',
        unidade: 'Unidade Sul',
        documento: '55566677788',
        endereco: 'Av Brasil, 1500',
        telefone: '11955554444',
        queixa_principal: 'Recuperação pós-AVC',
        data_nascimento: '1965-07-30 12:00:00.000Z',
      },
    ]

    const pacienteIds = {}

    for (const p of demoPacientes) {
      try {
        const existing = app.findFirstRecordByData('pacientes', 'documento', p.documento)
        pacienteIds[p.documento] = existing.id
      } catch (_) {
        const record = new Record(pacientes)
        record.set('usuario_id', adminId)
        record.set('nome', p.nome)
        record.set('email', p.email)
        record.set('telefone', p.telefone)
        record.set('data_nascimento', p.data_nascimento)
        record.set('unidade', p.unidade)
        record.set('documento', p.documento)
        record.set('endereco', p.endereco)
        record.set('queixa_principal', p.queixa_principal)
        record.set('ativo', true)
        app.save(record)
        pacienteIds[p.documento] = record.id
      }
    }

    const demoProtocolos = [
      {
        pacienteDoc: '11122233344',
        tipo: 'REAC',
        total_sessoes: 18,
        sessoes_concluidas: 5,
        status: 'ativo',
      },
      {
        pacienteDoc: '22233344455',
        tipo: 'tDCS',
        total_sessoes: 20,
        sessoes_concluidas: 10,
        status: 'ativo',
      },
      {
        pacienteDoc: '33344455566',
        tipo: 'tACS',
        total_sessoes: 15,
        sessoes_concluidas: 2,
        status: 'ativo',
      },
    ]

    const protocoloIds = {}

    for (const pr of demoProtocolos) {
      try {
        const existing = app.findFirstRecordByData(
          'protocolos',
          'paciente_id',
          pacienteIds[pr.pacienteDoc],
        )
        protocoloIds[pr.pacienteDoc] = existing.id
      } catch (_) {
        const record = new Record(protocolos)
        record.set('usuario_id', adminId)
        record.set('paciente_id', pacienteIds[pr.pacienteDoc])
        record.set('tipo', pr.tipo)
        record.set('total_sessoes', pr.total_sessoes)
        record.set('sessoes_concluidas', pr.sessoes_concluidas)
        record.set('status', pr.status)
        app.save(record)
        protocoloIds[pr.pacienteDoc] = record.id
      }
    }

    const now = new Date()

    // Realizadas
    for (let i = 1; i <= 10; i++) {
      const pastDate = new Date(now.getTime() - i * 86400000)
      try {
        app.findFirstRecordByData('sessoes', 'numero_sessao', i)
      } catch (_) {
        const record = new Record(sessoes)
        record.set('usuario_id', adminId)
        record.set('paciente_id', pacienteIds['11122233344'])
        record.set('protocolo_id', protocoloIds['11122233344'])
        record.set('numero_sessao', i)
        record.set('data_agendada', pastDate.toISOString())
        record.set('data_realizada', pastDate.toISOString())
        record.set('status', 'realizada')
        app.save(record)
      }
    }

    // Agendadas
    for (let i = 1; i <= 5; i++) {
      const futureDate = new Date(now.getTime() + i * 86400000)
      try {
        app.findFirstRecordByData('sessoes', 'numero_sessao', 10 + i)
      } catch (_) {
        const record = new Record(sessoes)
        record.set('usuario_id', adminId)
        record.set('paciente_id', pacienteIds['22233344455'])
        record.set('protocolo_id', protocoloIds['22233344455'])
        record.set('numero_sessao', 10 + i)
        record.set('data_agendada', futureDate.toISOString())
        record.set('status', 'agendada')
        app.save(record)
      }
    }

    const demoAlertas = [
      {
        pacienteDoc: '33344455566',
        tipo: 'risco_desistência',
        mensagem: 'Paciente com baixa adesão nas últimas 2 semanas.',
      },
      {
        pacienteDoc: '22233344455',
        tipo: 'falta_consecutiva',
        mensagem: 'Paciente faltou em duas sessões consecutivas.',
      },
      {
        pacienteDoc: '11122233344',
        tipo: 'observacao_clinica',
        mensagem: 'Relato de leve dor de cabeça após última sessão.',
      },
    ]

    for (const al of demoAlertas) {
      try {
        app.findFirstRecordByData('alertas', 'mensagem', al.mensagem)
      } catch (_) {
        const record = new Record(alertas)
        record.set('usuario_id', adminId)
        record.set('paciente_id', pacienteIds[al.pacienteDoc])
        record.set('tipo', al.tipo)
        record.set('mensagem', al.mensagem)
        record.set('lido', false)
        app.save(record)
      }
    }

    if (quickReports) {
      try {
        app.findFirstRecordByData('quick_reports', 'titulo', 'Evolução Positiva TDAH')
      } catch (_) {
        const record = new Record(quickReports)
        record.set('usuario_id', adminId)
        record.set('paciente_id', pacienteIds['33344455566'])
        record.set('titulo', 'Evolução Positiva TDAH')
        record.set(
          'conteudo',
          'Paciente relatou melhora significativa no foco durante o trabalho após a segunda sessão de tACS.',
        )
        app.save(record)
      }
    }
  },
  (app) => {
    // down
  },
)
