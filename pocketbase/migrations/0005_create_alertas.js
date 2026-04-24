migrate(
  (app) => {
    const collection = new Collection({
      name: 'alertas',
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
          values: ['risco_desistência', 'falta_consecutiva', 'pausa_excedida'],
          required: true,
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'lido', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('alertas'))
  },
)
