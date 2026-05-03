migrate(
  (app) => {
    // Update chain_breaks status to include "investigated"
    const chainBreaks = app.findCollectionByNameOrId('chain_breaks')
    chainBreaks.fields.removeByName('status')
    chainBreaks.fields.add(
      new SelectField({
        name: 'status',
        required: true,
        values: ['detected', 'investigating', 'resolved', 'investigated'],
        maxSelect: 1,
      }),
    )
    app.save(chainBreaks)

    // Create recovery_reports collection
    const recoveryReports = new Collection({
      name: 'recovery_reports',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      viewRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      createRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      updateRule: "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'",
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'chain_break_id',
          type: 'relation',
          required: true,
          collectionId: chainBreaks.id,
          maxSelect: 1,
        },
        {
          name: 'acao_tomada',
          type: 'select',
          required: true,
          values: ['restauracao', 'investigacao', 'delecao'],
          maxSelect: 1,
        },
        { name: 'logs_afetados', type: 'number', required: true },
        { name: 'notas_investigacao', type: 'text', required: false },
        { name: 'timestamp_resolucao', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(recoveryReports)
  },
  (app) => {
    try {
      const recoveryReports = app.findCollectionByNameOrId('recovery_reports')
      app.delete(recoveryReports)
    } catch (_) {}

    try {
      const chainBreaks = app.findCollectionByNameOrId('chain_breaks')
      chainBreaks.fields.removeByName('status')
      chainBreaks.fields.add(
        new SelectField({
          name: 'status',
          required: true,
          values: ['detected', 'investigating', 'resolved'],
          maxSelect: 1,
        }),
      )
      app.save(chainBreaks)
    } catch (_) {}
  },
)
