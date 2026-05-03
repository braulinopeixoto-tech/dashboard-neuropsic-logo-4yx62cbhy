migrate(
  (app) => {
    const collection = new Collection({
      name: 'admin_alerts',
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
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'log_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('audit_logs').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'tipo_alerta',
          type: 'select',
          required: true,
          values: ['corrupted', 'suspicious'],
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'lido', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('admin_alerts')
    app.delete(collection)
  },
)
