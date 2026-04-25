migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
      const riskCol = app.findCollectionByNameOrId('risk_score')
      const protocolos = app.findRecordsByFilter(
        'protocolos',
        `usuario_id = '${user.id}'`,
        '-created',
        5,
        0,
      )

      const levels = [
        {
          risk: 85,
          ad: 20,
          perf: 20,
          lvl: 'crítico',
          msg: 'Crítico: Paciente com 85% de risco de abandono. Intervalo de 15 dias sem sessão.',
          rec: 'Contato telefônico urgente + remarcação automática',
        },
        {
          risk: 70,
          ad: 50,
          perf: 40,
          lvl: 'alto',
          msg: 'Alto: Paciente com 2 faltas consecutivas. Recomenda-se contato imediato.',
          rec: 'Contato via WhatsApp + oferecer horário alternativo',
        },
        {
          risk: 45,
          ad: 38,
          perf: 60,
          lvl: 'moderado',
          msg: 'Moderado: Aderência em 38%. Acompanhar próximas sessões.',
          rec: 'Enviar lembrete 24h antes da próxima sessão',
        },
        {
          risk: 10,
          ad: 90,
          perf: 85,
          lvl: 'baixo',
          msg: 'Baixo: Paciente em dia com protocolo.',
          rec: 'Continuar acompanhamento normal',
        },
        {
          risk: 90,
          ad: 10,
          perf: 10,
          lvl: 'crítico',
          msg: 'Crítico: Paciente com 90% de risco de abandono. Múltiplas faltas.',
          rec: 'Contato telefônico urgente + remarcação automática',
        },
      ]

      for (let i = 0; i < protocolos.length && i < levels.length; i++) {
        const p = protocolos[i]
        try {
          app.findFirstRecordByFilter('risk_score', `protocolo_id = '${p.id}'`)
        } catch (_) {
          const record = new Record(riskCol)
          record.set('usuario_id', user.id)
          record.set('paciente_id', p.get('paciente_id'))
          record.set('protocolo_id', p.id)
          record.set('timestamp', new Date().toISOString())
          record.set('abandonment_risk', levels[i].risk)
          record.set('adherence_score', levels[i].ad)
          record.set('performance_score', levels[i].perf)
          record.set('alert_level', levels[i].lvl)
          record.set('alert_message', levels[i].msg)
          record.set('recommendation', levels[i].rec)
          app.save(record)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      app.db().newQuery('DELETE FROM risk_score').execute()
    } catch (_) {}
  },
)
