migrate(
  (app) => {
    const collection = new Collection({
      name: 'convergence_log',
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
          name: 'dnda_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('dnda_schema').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'convergence_score_old', type: 'number' },
        { name: 'convergence_score_new', type: 'number' },
        { name: 'change_reason', type: 'text' },
        { name: 'timestamp', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('convergence_log')
    app.delete(collection)
  },
)
