migrate(
  (app) => {
    const dnda = app.findCollectionByNameOrId('dnda')

    const newFields = [
      new NumberField({ name: 'neuroenergetica_potencia' }),
      new NumberField({ name: 'neuroenergetica_tbr' }),
      new NumberField({ name: 'neuroenergetica_excitacao' }),
      new SelectField({
        name: 'neuroenergetica_variabilidade',
        values: ['Instável', 'Normal', 'Rígido'],
        maxSelect: 1,
      }),

      new NumberField({ name: 'integracao_coerencia' }),
      new NumberField({ name: 'integracao_conectividade' }),
      new SelectField({
        name: 'integracao_dmn',
        values: ['Acoplado', 'Desacoplado', 'Hiperacoplado'],
        maxSelect: 1,
      }),
      new SelectField({
        name: 'integracao_salience',
        values: ['Acoplado', 'Desacoplado', 'Hiperacoplado'],
        maxSelect: 1,
      }),
      new SelectField({
        name: 'integracao_executive',
        values: ['Acoplado', 'Desacoplado', 'Hiperacoplado'],
        maxSelect: 1,
      }),

      new NumberField({ name: 'organizacional_simetria' }),
      new NumberField({ name: 'organizacional_gradientes' }),
      new NumberField({ name: 'organizacional_topografia' }),
      new NumberField({ name: 'organizacional_complexidade' }),

      new NumberField({ name: 'funcional_atencao_sustentada' }),
      new NumberField({ name: 'funcional_atencao_seletiva' }),
      new NumberField({ name: 'funcional_controle_inibitorio' }),
      new NumberField({ name: 'funcional_flexibilidade' }),
      new NumberField({ name: 'funcional_memoria_trabalho' }),
      new NumberField({ name: 'funcional_processamento_emocional' }),
      new SelectField({
        name: 'funcional_big_five',
        values: ['Abertura', 'Consciência', 'Extroversão', 'Amabilidade', 'Neuroticismo'],
        maxSelect: 1,
      }),

      new NumberField({ name: 'rdoc_valencia_negativa' }),
      new NumberField({ name: 'rdoc_valencia_positiva' }),
      new NumberField({ name: 'rdoc_sistemas_cognitivos' }),
      new NumberField({ name: 'rdoc_sistemas_sociais' }),
      new NumberField({ name: 'rdoc_regulacao_sensoriomotora' }),
      new NumberField({ name: 'rdoc_arousal_regulacao' }),

      new NumberField({ name: 'neurobiologica_metabolismo' }),
      new NumberField({ name: 'neurobiologica_inflamacao' }),
      new NumberField({ name: 'neurobiologica_sono' }),
      new NumberField({ name: 'neurobiologica_hrv' }),
      new SelectField({
        name: 'neurobiologica_ciclo_menstrual',
        values: ['Regular', 'Irregular', 'N/A'],
        maxSelect: 1,
      }),
      new SelectField({
        name: 'neurobiologica_dieta',
        values: ['Balanceada', 'Seletiva', 'Abusiva'],
        maxSelect: 1,
      }),
      new SelectField({
        name: 'neurobiologica_intestino',
        values: ['Normal', 'Constipação', 'Diarreia'],
        maxSelect: 1,
      }),

      new TextField({ name: 'temporal_traumas' }),
      new TextField({ name: 'temporal_perdas' }),
      new TextField({ name: 'temporal_evolucao' }),
      new TextField({ name: 'temporal_resposta_intervencoes' }),
      new SelectField({
        name: 'temporal_classificacao_perdas',
        values: ['Com oportunidade', 'Sem oportunidade', 'Terminal'],
        maxSelect: 1,
      }),

      new SelectField({
        name: 'convergencia_risco_clinico',
        values: ['Baixo', 'Médio', 'Alto'],
        maxSelect: 1,
      }),
      new TextField({ name: 'convergencia_estado_neurofuncional' }),
      new TextField({ name: 'convergencia_vetor_adaptativo' }),
      new TextField({ name: 'convergencia_resumo' }),

      new BoolField({ name: 'intervencao_base' }),
      new BoolField({ name: 'intervencao_integracao' }),
      new BoolField({ name: 'intervencao_especializacao' }),
      new BoolField({ name: 'intervencao_neuromodulacao_tdcs' }),
      new BoolField({ name: 'intervencao_neuromodulacao_tacs' }),
      new BoolField({ name: 'intervencao_neuromodulacao_reac' }),
      new BoolField({ name: 'intervencao_neuromodulacao_tms' }),
      new BoolField({ name: 'intervencao_neurofeedback' }),
      new BoolField({ name: 'intervencao_biofeedback' }),
    ]

    newFields.forEach((f) => {
      if (!dnda.fields.getByName(f.name)) {
        dnda.fields.add(f)
      }
    })
    app.save(dnda)

    if (!app.hasTable('quick_reports')) {
      const quickReport = new Collection({
        name: 'quick_reports',
        type: 'base',
        listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
        updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        fields: [
          { name: 'usuario_id', type: 'relation', required: true, collectionId: '_pb_users_auth_' },
          {
            name: 'paciente_id',
            type: 'relation',
            required: true,
            collectionId: app.findCollectionByNameOrId('pacientes').id,
          },
          { name: 'titulo', type: 'text', required: true },
          { name: 'conteudo', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(quickReport)
    }
  },
  (app) => {
    const dnda = app.findCollectionByNameOrId('dnda')
    const fieldsToRemove = [
      'neuroenergetica_potencia',
      'neuroenergetica_tbr',
      'neuroenergetica_excitacao',
      'neuroenergetica_variabilidade',
      'integracao_coerencia',
      'integracao_conectividade',
      'integracao_dmn',
      'integracao_salience',
      'integracao_executive',
      'organizacional_simetria',
      'organizacional_gradientes',
      'organizacional_topografia',
      'organizacional_complexidade',
      'funcional_atencao_sustentada',
      'funcional_atencao_seletiva',
      'funcional_controle_inibitorio',
      'funcional_flexibilidade',
      'funcional_memoria_trabalho',
      'funcional_processamento_emocional',
      'funcional_big_five',
      'rdoc_valencia_negativa',
      'rdoc_valencia_positiva',
      'rdoc_sistemas_cognitivos',
      'rdoc_sistemas_sociais',
      'rdoc_regulacao_sensoriomotora',
      'rdoc_arousal_regulacao',
      'neurobiologica_metabolismo',
      'neurobiologica_inflamacao',
      'neurobiologica_sono',
      'neurobiologica_hrv',
      'neurobiologica_ciclo_menstrual',
      'neurobiologica_dieta',
      'neurobiologica_intestino',
      'temporal_traumas',
      'temporal_perdas',
      'temporal_evolucao',
      'temporal_resposta_intervencoes',
      'temporal_classificacao_perdas',
      'convergencia_risco_clinico',
      'convergencia_estado_neurofuncional',
      'convergencia_vetor_adaptativo',
      'convergencia_resumo',
      'intervencao_base',
      'intervencao_integracao',
      'intervencao_especializacao',
      'intervencao_neuromodulacao_tdcs',
      'intervencao_neuromodulacao_tacs',
      'intervencao_neuromodulacao_reac',
      'intervencao_neuromodulacao_tms',
      'intervencao_neurofeedback',
      'intervencao_biofeedback',
    ]
    fieldsToRemove.forEach((f) => {
      if (dnda.fields.getByName(f)) {
        dnda.fields.removeByName(f)
      }
    })
    app.save(dnda)

    if (app.hasTable('quick_reports')) {
      app.delete(app.findCollectionByNameOrId('quick_reports'))
    }
  },
)
