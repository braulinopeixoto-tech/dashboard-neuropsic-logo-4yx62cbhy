migrate(
  (app) => {
    const collection = new Collection({
      name: 'risk_score',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
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
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'protocolo_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('protocolos').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'timestamp', type: 'date' },
        { name: 'abandonment_risk', type: 'number' },
        { name: 'adherence_score', type: 'number' },
        { name: 'performance_score', type: 'number' },
        {
          name: 'alert_level',
          type: 'select',
          values: ['baixo', 'moderado', 'alto', 'crítico'],
          maxSelect: 1,
        },
        { name: 'alert_message', type: 'text' },
        { name: 'recommendation', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_risk_score_pac_prot ON risk_score (paciente_id, protocolo_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('risk_score')
    app.delete(collection)
  },
)
