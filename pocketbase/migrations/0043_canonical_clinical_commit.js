migrate(
  (app) => {
    const patients = app.findCollectionByNameOrId('pacientes')
    if (!patients.fields.getByName('registration_key')) {
      patients.fields.add(new TextField({ name: 'registration_key', required: false }))
    }
    patients.addIndex(
      'idx_pacientes_registration_key_unique',
      true,
      'usuario_id, registration_key',
      "registration_key != ''",
    )
    app.save(patients)

    const reports = app.findCollectionByNameOrId('quick_reports')
    reports.createRule = null
    reports.updateRule = null
    reports.deleteRule = null

    if (!reports.fields.getByName('status')) {
      reports.fields.add(
        new SelectField({
          name: 'status',
          required: false,
          values: [
            'DRAFT',
            'HUMAN_REVIEW_PENDING',
            'HUMAN_APPROVED',
            'CANONICAL_COMMITTED',
            'FAILED',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!reports.fields.getByName('version')) {
      reports.fields.add(new NumberField({ name: 'version', required: false, min: 1 }))
    }
    if (!reports.fields.getByName('profile')) {
      reports.fields.add(new TextField({ name: 'profile', required: false }))
    }
    if (!reports.fields.getByName('source_fingerprint')) {
      reports.fields.add(new TextField({ name: 'source_fingerprint', required: false }))
    }
    if (!reports.fields.getByName('report_fingerprint')) {
      reports.fields.add(new TextField({ name: 'report_fingerprint', required: false }))
    }
    if (!reports.fields.getByName('engine_version')) {
      reports.fields.add(new TextField({ name: 'engine_version', required: false }))
    }
    if (!reports.fields.getByName('review_decision')) {
      reports.fields.add(
        new SelectField({
          name: 'review_decision',
          required: false,
          values: ['PENDING', 'APPROVED', 'REJECTED'],
          maxSelect: 1,
        }),
      )
    }
    if (!reports.fields.getByName('reviewed_at')) {
      reports.fields.add(new DateField({ name: 'reviewed_at', required: false }))
    }
    if (!reports.fields.getByName('reviewed_by')) {
      reports.fields.add(
        new RelationField({
          name: 'reviewed_by',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    if (!reports.fields.getByName('provenance')) {
      reports.fields.add(new JSONField({ name: 'provenance', required: false }))
    }
    if (!reports.fields.getByName('context_snapshot')) {
      reports.fields.add(new JSONField({ name: 'context_snapshot', required: false }))
    }
    if (!reports.fields.getByName('canonical_at')) {
      reports.fields.add(new DateField({ name: 'canonical_at', required: false }))
    }
    if (!reports.fields.getByName('submission_key')) {
      reports.fields.add(new TextField({ name: 'submission_key', required: false }))
    }

    reports.addIndex(
      'idx_quick_reports_submission_key_unique',
      true,
      'usuario_id, submission_key',
      "submission_key != ''",
    )
    reports.addIndex(
      'idx_quick_reports_patient_version',
      true,
      'usuario_id, paciente_id, profile, version',
      "status = 'CANONICAL_COMMITTED'",
    )
    app.save(reports)

    const heads = new Collection({
      name: 'quick_report_heads',
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
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'report_id',
          type: 'relation',
          required: true,
          collectionId: reports.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'profile', type: 'text', required: true },
        { name: 'version', type: 'number', required: true, min: 1 },
        { name: 'report_fingerprint', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_quick_report_heads_patient_profile ON quick_report_heads (usuario_id, paciente_id, profile)',
      ],
    })
    app.save(heads)

    const events = new Collection({
      name: 'clinical_commit_events',
      type: 'base',
      listRule: "@request.auth.id != '' && actor_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && actor_id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'actor_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: patients.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'report_id',
          type: 'relation',
          required: true,
          collectionId: reports.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'event_type',
          type: 'select',
          required: true,
          values: ['CANONICAL_REPORT_COMMITTED'],
          maxSelect: 1,
        },
        { name: 'previous_event_hash', type: 'text', required: false },
        { name: 'event_hash', type: 'text', required: true },
        { name: 'report_fingerprint', type: 'text', required: true },
        { name: 'metadata', type: 'json', required: true },
        { name: 'timestamp', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_clinical_commit_event_hash ON clinical_commit_events (event_hash)',
        'CREATE INDEX idx_clinical_commit_patient_time ON clinical_commit_events (paciente_id, timestamp)',
      ],
    })
    app.save(events)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('clinical_commit_events'))
    app.delete(app.findCollectionByNameOrId('quick_report_heads'))

    const reports = app.findCollectionByNameOrId('quick_reports')
    reports.fields.removeByName('status')
    reports.fields.removeByName('version')
    reports.fields.removeByName('profile')
    reports.fields.removeByName('source_fingerprint')
    reports.fields.removeByName('report_fingerprint')
    reports.fields.removeByName('engine_version')
    reports.fields.removeByName('review_decision')
    reports.fields.removeByName('reviewed_at')
    reports.fields.removeByName('reviewed_by')
    reports.fields.removeByName('provenance')
    reports.fields.removeByName('context_snapshot')
    reports.fields.removeByName('canonical_at')
    reports.fields.removeByName('submission_key')
    reports.removeIndex('idx_quick_reports_submission_key_unique')
    reports.removeIndex('idx_quick_reports_patient_version')
    reports.createRule = "@request.auth.id != '' && @request.auth.tipo = 'neuropsicólogo'"
    reports.updateRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    reports.deleteRule = "@request.auth.id != '' && usuario_id = @request.auth.id"
    app.save(reports)

    const patients = app.findCollectionByNameOrId('pacientes')
    patients.fields.removeByName('registration_key')
    patients.removeIndex('idx_pacientes_registration_key_unique')
    app.save(patients)
  },
)
