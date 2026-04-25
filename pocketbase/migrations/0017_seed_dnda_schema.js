migrate(
  (app) => {
    const dndaSchema = app.findCollectionByNameOrId('dnda_schema')

    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
      const paciente = app.findFirstRecordByData('pacientes', 'usuario_id', user.id)

      try {
        app.findFirstRecordByData('dnda_schema', 'clinical_justification', 'High convergence mock')
      } catch (_) {
        const record1 = new Record(dndaSchema)
        record1.set('usuario_id', user.id)
        record1.set('paciente_id', paciente.id)
        record1.set('timestamp', new Date().toISOString())
        record1.set('neuro_energy', 8)
        record1.set('network_integration', 8)
        record1.set('organization', 8)
        record1.set('cognitive_function', {
          atencao_sustentada: 8,
          memoria_trabalho: 8,
          atencao_seletiva: 8,
          controle_inibitorio: 8,
          flexibilidade: 8,
          processamento_emocional: 8,
        })
        record1.set('temporal_index', { traumas: 'Nenhum', perdas: 'Nenhuma', evolucao: 'Estável' })
        record1.set('convergence_score', 85)
        record1.set('confidence_level', 1.0)
        record1.set('classification', 'estável')
        record1.set('integration_status', 'acoplado')
        record1.set('organization_status', 'coerente')
        record1.set('risk_level', 'baixo')
        record1.set('clinical_justification', 'High convergence mock')
        record1.set('raw_data', {})
        app.save(record1)
      }

      try {
        app.findFirstRecordByData(
          'dnda_schema',
          'clinical_justification',
          'Medium convergence mock',
        )
      } catch (_) {
        const record2 = new Record(dndaSchema)
        record2.set('usuario_id', user.id)
        record2.set('paciente_id', paciente.id)
        record2.set('timestamp', new Date().toISOString())
        record2.set('neuro_energy', 5)
        record2.set('network_integration', 5)
        record2.set('organization', 5)
        record2.set('cognitive_function', {
          atencao_sustentada: 5,
          memoria_trabalho: 5,
          atencao_seletiva: 5,
          controle_inibitorio: 5,
          flexibilidade: 5,
          processamento_emocional: 5,
        })
        record2.set('temporal_index', {
          traumas: 'Alguns',
          perdas: 'Média',
          evolucao: 'Em observação',
        })
        record2.set('convergence_score', 50)
        record2.set('confidence_level', 0.9)
        record2.set('classification', 'estável')
        record2.set('integration_status', 'acoplado')
        record2.set('organization_status', 'normal')
        record2.set('risk_level', 'moderado')
        record2.set('clinical_justification', 'Medium convergence mock')
        record2.set('raw_data', {})
        app.save(record2)
      }

      try {
        app.findFirstRecordByData('dnda_schema', 'clinical_justification', 'Low convergence mock')
      } catch (_) {
        const record3 = new Record(dndaSchema)
        record3.set('usuario_id', user.id)
        record3.set('paciente_id', paciente.id)
        record3.set('timestamp', new Date().toISOString())
        record3.set('neuro_energy', 2)
        record3.set('network_integration', 2)
        record3.set('organization', 2)
        record3.set('cognitive_function', {
          atencao_sustentada: 2,
          memoria_trabalho: 2,
          atencao_seletiva: 2,
          controle_inibitorio: 2,
          flexibilidade: 2,
          processamento_emocional: 2,
        })
        record3.set('temporal_index', {
          traumas: 'Graves',
          perdas: 'Recentes',
          evolucao: 'Instável',
        })
        record3.set('convergence_score', 20)
        record3.set('confidence_level', 0.8)
        record3.set('classification', 'hipoativo')
        record3.set('integration_status', 'desacoplado')
        record3.set('organization_status', 'difuso')
        record3.set('intervention_priority', 9)
        record3.set('risk_level', 'alto')
        record3.set('clinical_justification', 'Low convergence mock')
        record3.set('raw_data', {})
        app.save(record3)
      }
    } catch (err) {
      console.log('Skipping seed due to missing dependencies:', err.message)
    }
  },
  (app) => {
    try {
      app
        .db()
        .newQuery("DELETE FROM dnda_schema WHERE clinical_justification LIKE '%mock%'")
        .execute()
    } catch (_) {}
  },
)
