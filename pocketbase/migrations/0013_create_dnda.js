migrate(
  (app) => {
    const collection = new Collection({
      name: 'dnda',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
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

        { name: 'd1_delta', type: 'number', min: 0, max: 10 },
        { name: 'd1_theta', type: 'number', min: 0, max: 10 },
        { name: 'd1_alpha', type: 'number', min: 0, max: 10 },
        { name: 'd1_beta', type: 'number', min: 0, max: 10 },
        { name: 'd1_gamma', type: 'number', min: 0, max: 10 },
        { name: 'd1_tbr', type: 'number', min: 0, max: 10 },
        { name: 'd1_excitation', type: 'number', min: 0, max: 10 },
        {
          name: 'd1_variability',
          type: 'select',
          values: ['instável', 'normal', 'rígido'],
          maxSelect: 1,
        },
        {
          name: 'd1_class',
          type: 'select',
          values: ['hipoativo', 'hiperativo', 'instável'],
          maxSelect: 1,
        },

        { name: 'd2_coherence', type: 'number', min: 0, max: 10 },
        { name: 'd2_connectivity', type: 'number', min: 0, max: 10 },
        {
          name: 'd2_dmn',
          type: 'select',
          values: ['acoplado', 'desacoplado', 'hiperacoplado'],
          maxSelect: 1,
        },
        {
          name: 'd2_salience',
          type: 'select',
          values: ['acoplado', 'desacoplado', 'hiperacoplado'],
          maxSelect: 1,
        },
        {
          name: 'd2_executive',
          type: 'select',
          values: ['acoplado', 'desacoplado', 'hiperacoplado'],
          maxSelect: 1,
        },

        { name: 'd3_symmetry', type: 'number', min: 0, max: 10 },
        { name: 'd3_gradients', type: 'number', min: 0, max: 10 },
        { name: 'd3_topography', type: 'number', min: 0, max: 10 },
        { name: 'd3_entropy', type: 'number', min: 0, max: 10 },
        {
          name: 'd3_class',
          type: 'select',
          values: ['coerente', 'difuso', 'desorganizado'],
          maxSelect: 1,
        },

        { name: 'd4_attention', type: 'number', min: 0, max: 10 },
        { name: 'd4_inhibitory', type: 'number', min: 0, max: 10 },
        { name: 'd4_flexibility', type: 'number', min: 0, max: 10 },
        { name: 'd4_memory', type: 'number', min: 0, max: 10 },
        { name: 'd4_emotion', type: 'number', min: 0, max: 10 },
        {
          name: 'd4_big_five',
          type: 'select',
          values: ['abertura', 'consciência', 'extroversão', 'amabilidade', 'neuroticismo'],
          maxSelect: 1,
        },

        { name: 'd5_negative', type: 'number', min: 0, max: 10 },
        { name: 'd5_positive', type: 'number', min: 0, max: 10 },
        { name: 'd5_cognitive', type: 'number', min: 0, max: 10 },
        { name: 'd5_social', type: 'number', min: 0, max: 10 },
        { name: 'd5_sensory', type: 'number', min: 0, max: 10 },
        { name: 'd5_arousal', type: 'number', min: 0, max: 10 },

        { name: 'd6_metabolism', type: 'number', min: 0, max: 10 },
        { name: 'd6_inflammation', type: 'number', min: 0, max: 10 },
        { name: 'd6_sleep', type: 'number', min: 0, max: 10 },
        { name: 'd6_hrv', type: 'number', min: 0, max: 10 },
        {
          name: 'd6_menstrual',
          type: 'select',
          values: ['regular', 'irregular', 'menopausa', 'n/a'],
          maxSelect: 1,
        },
        {
          name: 'd6_diet',
          type: 'select',
          values: ['adequada', 'inflamatória', 'restritiva'],
          maxSelect: 1,
        },
        {
          name: 'd6_intestinal',
          type: 'select',
          values: ['regular', 'constipado', 'diarreico', 'alternante'],
          maxSelect: 1,
        },

        { name: 'd7_traumas', type: 'text' },
        { name: 'd7_losses', type: 'text' },
        { name: 'd7_evolution', type: 'text' },
        { name: 'd7_previous', type: 'text' },
        {
          name: 'd7_loss_class',
          type: 'select',
          values: ['aguda', 'crônica', 'resolvida'],
          maxSelect: 1,
        },

        { name: 'd8_risk', type: 'select', values: ['baixo', 'médio', 'alto'], maxSelect: 1 },
        { name: 'd8_summary', type: 'text' },

        { name: 'd9_phases', type: 'json' },
        { name: 'd9_tools', type: 'json' },

        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('dnda')
    app.delete(collection)
  },
)
