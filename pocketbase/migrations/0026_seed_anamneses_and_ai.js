migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'braulinopeixoto@gmail.com')
      const pacientes = app.findRecordsByFilter(
        'pacientes',
        `usuario_id = '${user.id}'`,
        '-created',
        1,
        0,
      )
      if (pacientes.length === 0) return
      const paciente = pacientes[0]

      // Anamneses seed
      const anamneseCol = app.findCollectionByNameOrId('anamneses')
      for (let i = 1; i <= 3; i++) {
        const record = new Record(anamneseCol)
        record.set('usuario_id', user.id)
        record.set('paciente_id', paciente.id)
        record.set(
          'queixa_principal',
          `Paciente relata dores de cabeça constantes há 3 meses - Teste ${i}`,
        )
        record.set('queixa_estruturada', {
          sintoma_principal: 'Cefaleia',
          duracao: '3 meses',
          intensidade: 7,
          fatores_desencadeadores: 'Estresse',
          impacto_funcional: 'Moderado',
        })
        record.set(
          'historia_clinica',
          `História clínica detalhada do paciente ${i}. Relata fadiga e estresse no trabalho.`,
        )
        record.set(
          'historia_resumida',
          `Resumo narrativo gerado por IA: O paciente apresenta cefaleia crônica associada a estresse laboral.`,
        )
        record.set('antecedentes_pessoais', 'Hipertensão')
        record.set('antecedentes_familiares', 'Pai hipertenso')
        record.set('medicacoes', ['Losartana 50mg'])
        record.set('alergias', [])
        record.set('cirurgias', [])
        record.set('traumas', 'Nenhum')
        record.set('perdas_recentes', 'Nenhuma')
        record.set('pressao_arterial', '120/80')
        record.set('frequencia_cardiaca', 80)
        record.set('frequencia_respiratoria', 16)
        record.set('temperatura', 36.5)
        record.set('imc', 24.5)
        record.set('exame_neurologico', 'Reflexos preservados')
        record.set('exame_psiquico', 'Lúcido, orientado, afeição modulada')
        record.set('impressao_clinica', 'Cefaleia tensional e estresse.')
        record.set(
          'impressao_ia',
          'Impressão clínica estruturada: Cefaleia tensional associada a burnout ocupacional.',
        )
        app.save(record)
      }

      // AI Logs seed
      const aiCol = app.findCollectionByNameOrId('ai_interactions')
      for (let i = 1; i <= 5; i++) {
        const record = new Record(aiCol)
        record.set('usuario_id', user.id)
        record.set('paciente_id', paciente.id)
        record.set('tipo_interacao', i % 2 === 0 ? 'queixa' : 'resumo')
        record.set('prompt_context', `Texto de teste para prompt de IA #${i}`)
        record.set('response_data', { resultado: 'Análise gerada com sucesso.' })
        record.set('model', 'gpt-4o-mini')
        record.set('tokens_used', 150 + i * 10)
        record.set('confidence_level', 0.95)
        app.save(record)
      }
    } catch (err) {
      // Ignore if user not found or error
    }
  },
  (app) => {},
)
