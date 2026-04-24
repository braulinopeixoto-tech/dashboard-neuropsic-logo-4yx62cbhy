migrate(
  (app) => {
    const collection = new Collection({
      name: 'protocolos',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'paciente_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['REAC', 'tDCS', 'tACS'],
          required: true,
          maxSelect: 1,
        },
        { name: 'total_sessoes', type: 'number', required: true, min: 1 },
        { name: 'sessoes_concluidas', type: 'number' },
        { name: 'intervalo_minimo_minutos', type: 'number' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_prevista_fim', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'pausado', 'concluído', 'cancelado'],
          required: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('protocolos'))
  },
)
