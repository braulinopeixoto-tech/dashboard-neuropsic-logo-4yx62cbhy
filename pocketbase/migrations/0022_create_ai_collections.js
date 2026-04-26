migrate(
  (app) => {
    const anamneses = new Collection({
      name: 'anamneses',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'queixa_estruturada', type: 'json', required: true },
        { name: 'historia_resumo', type: 'text', required: false },
        { name: 'exame_fisico', type: 'json', required: false },
        { name: 'impressao_clinica', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(anamneses)

    const aiInteractions = new Collection({
      name: 'ai_interactions',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo_interacao',
          type: 'select',
          required: true,
          values: ['queixa', 'resumo', 'impressao'],
          maxSelect: 1,
        },
        { name: 'prompt_context', type: 'text', required: true },
        { name: 'response_data', type: 'json', required: true },
        { name: 'confidence_level', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(aiInteractions)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('ai_interactions'))
    app.delete(app.findCollectionByNameOrId('anamneses'))
  },
)
