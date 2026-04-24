migrate(
  (app) => {
    const collection = new Collection({
      name: 'sessoes',
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
          name: 'protocolo_id',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('protocolos').id,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'numero_sessao', type: 'number', required: true, min: 1 },
        { name: 'data_agendada', type: 'date' },
        { name: 'data_realizada', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'realizada', 'faltou', 'remarcada'],
          required: true,
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('sessoes'))
  },
)
