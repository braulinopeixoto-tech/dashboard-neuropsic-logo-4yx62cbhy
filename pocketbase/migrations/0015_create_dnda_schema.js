migrate(
  (app) => {
    const collection = new Collection({
      name: 'dnda_schema',
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
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('pacientes').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'timestamp', type: 'date', required: true },
        { name: 'neuro_energy', type: 'number', min: 0, max: 10 },
        { name: 'network_integration', type: 'number', min: 0, max: 10 },
        { name: 'organization', type: 'number', min: 0, max: 10 },
        { name: 'cognitive_function', type: 'json' },
        { name: 'rdoc_domains', type: 'json' },
        { name: 'bio_markers', type: 'json' },
        { name: 'temporal_index', type: 'json' },
        { name: 'convergence_score', type: 'number' },
        { name: 'confidence_level', type: 'number' },
        {
          name: 'classification',
          type: 'select',
          values: ['hipoativo', 'hiperativo', 'instável', 'estável'],
          maxSelect: 1,
        },
        {
          name: 'integration_status',
          type: 'select',
          values: ['acoplado', 'desacoplado', 'hiperacoplado'],
          maxSelect: 1,
        },
        {
          name: 'organization_status',
          type: 'select',
          values: ['coerente', 'difuso', 'normal'],
          maxSelect: 1,
        },
        { name: 'dominant_pattern', type: 'text' },
        { name: 'adaptive_vector', type: 'text' },
        { name: 'risk_level', type: 'select', values: ['baixo', 'moderado', 'alto'], maxSelect: 1 },
        { name: 'intervention_priority', type: 'number', min: 1, max: 10 },
        { name: 'clinical_justification', type: 'text' },
        { name: 'raw_data', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('dnda_schema')
    app.delete(collection)
  },
)
