migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
      const pacientes = app.findRecordsByFilter(
        'pacientes',
        `usuario_id="${user.id}"`,
        '-created',
        1,
        0,
      )
      if (pacientes.length === 0) return
      const paciente = pacientes[0]

      const alertas = app.findCollectionByNameOrId('alertas')

      // Avoid duplicate seeding
      const existing = app.findRecordsByFilter('alertas', `usuario_id="${user.id}"`, '', 1, 0)
      if (existing.length > 0) return

      const data = [
        { tipo: 'risco_desistência', msg: 'Baixo engajamento nas últimas sessões', lido: false },
        { tipo: 'falta_consecutiva', msg: 'Falta em 2 sessões seguidas', lido: false },
        { tipo: 'pausa_excedida', msg: 'Pausa no protocolo REAC excedeu 15 dias', lido: false },
        { tipo: 'observacao_clinica', msg: 'Relatou dores de cabeça intensas', lido: true },
        { tipo: 'risco_desistência', msg: 'Falta de resposta aos lembretes', lido: true },
      ]

      for (const d of data) {
        const a = new Record(alertas)
        a.set('usuario_id', user.id)
        a.set('paciente_id', paciente.id)
        a.set('tipo', d.tipo)
        a.set('mensagem', d.msg)
        a.set('lido', d.lido)
        app.save(a)
      }
    } catch (e) {
      // Fail silently if seed requirements are not met
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
      app
        .db()
        .newQuery('DELETE FROM alertas WHERE usuario_id = {:uid}')
        .bind({ uid: user.id })
        .execute()
    } catch (e) {}
  },
)
