migrate(
  (app) => {
    const collection = new Collection({
      name: 'audit_log',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: null,
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
          name: 'entity_type',
          type: 'select',
          required: true,
          values: ['DNDA', 'protocolo', 'sessao', 'alerta', 'intervencao'],
          maxSelect: 1,
        },
        { name: 'entity_id', type: 'text', required: true },
        { name: 'version', type: 'number', required: true },
        { name: 'timestamp', type: 'date', required: true },
        {
          name: 'author_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'action',
          type: 'select',
          required: true,
          values: ['create', 'update', 'delete'],
          maxSelect: 1,
        },
        { name: 'change_summary', type: 'text', required: true },
        { name: 'old_values', type: 'json', required: false },
        { name: 'new_values', type: 'json', required: false },
        { name: 'hash_integrity', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id)',
        'CREATE INDEX idx_audit_log_usuario ON audit_log (usuario_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('audit_log')
    app.delete(collection)
  },
)
