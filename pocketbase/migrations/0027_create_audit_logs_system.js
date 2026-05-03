migrate(
  (app) => {
    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.tipo = 'neuropsicólogo')",
      viewRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.tipo = 'neuropsicólogo')",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          minSelect: null,
          maxSelect: 1,
        },
        {
          name: 'event_type',
          type: 'select',
          required: true,
          values: ['login', 'vital_score', 'acesso_prontuario'],
          maxSelect: 1,
        },
        { name: 'action_description', type: 'text', max: 500 },
        { name: 'payload', type: 'json' },
        { name: 'timestamp', type: 'date' },
        { name: 'hash_sha256', type: 'text' },
        { name: 'previous_hash', type: 'text' },
        {
          name: 'integrity_status',
          type: 'select',
          values: ['valid', 'pending', 'corrupted'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(auditLogs)

    const hashChain = new Collection({
      name: 'hash_chain',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'log_id',
          type: 'relation',
          required: true,
          collectionId: auditLogs.id,
          cascadeDelete: true,
          minSelect: null,
          maxSelect: 1,
        },
        { name: 'current_hash', type: 'text' },
        { name: 'previous_hash', type: 'text' },
        { name: 'chain_position', type: 'number', onlyInt: true },
        { name: 'verified_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(hashChain)
  },
  (app) => {
    try {
      const hc = app.findCollectionByNameOrId('hash_chain')
      app.delete(hc)
    } catch (e) {}
    try {
      const al = app.findCollectionByNameOrId('audit_logs')
      app.delete(al)
    } catch (e) {}
  },
)
