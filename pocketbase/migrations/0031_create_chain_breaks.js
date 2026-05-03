migrate(
  (app) => {
    const collection = new Collection({
      name: 'chain_breaks',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      viewRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      createRule: null,
      updateRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'first_corrupted_log_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('audit_logs').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'last_corrupted_log_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('audit_logs').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'affected_logs_count', type: 'number', required: true },
        { name: 'detected_at', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['detected', 'investigating', 'resolved'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('chain_breaks')
    app.delete(collection)
  },
)
