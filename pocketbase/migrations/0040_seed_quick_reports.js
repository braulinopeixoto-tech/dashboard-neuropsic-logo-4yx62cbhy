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
      const paciente = app.findFirstRecordByData('pacientes', 'documento', '33344455566')
      pacienteId = paciente.id
    } catch (_) {
      return
    }

    try {
      app.findFirstRecordByData('quick_reports', 'titulo', 'Evolução Positiva TDAH')
    } catch (_) {
      const record = new Record(quickReports)
      record.set('usuario_id', adminId)
      record.set('paciente_id', pacienteId)
      record.set('titulo', 'Evolução Positiva TDAH')
      record.set(
        'conteudo',
        'Paciente relatou melhora significativa no foco durante o trabalho após a segunda sessão de tACS.',
      )
      app.save(record)
    }
  },
  (app) => {
    // down
  },
)
