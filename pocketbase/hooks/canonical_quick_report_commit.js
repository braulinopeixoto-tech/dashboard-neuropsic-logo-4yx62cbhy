routerAdd(
  'POST',
  '/backend/v1/quick-reports/commit',
  (e) => {
    const body = e.requestInfo().body || {}
    const requiredText = [
      'pacienteId',
      'titulo',
      'profile',
      'conteudo',
      'sourceCanonical',
      'sourceFingerprint',
      'reportFingerprint',
      'engineVersion',
      'submissionKey',
    ]

    for (const field of requiredText) {
      if (typeof body[field] !== 'string' || body[field].trim() === '') {
        throw new BadRequestError(`Campo obrigatório ausente: ${field}`)
      }
    }
    if (body.reviewDecision !== 'APPROVED') {
      throw new BadRequestError('O Clinical Commit exige aprovação profissional explícita.')
    }
    if (body.conteudo.length > 50000) {
      throw new BadRequestError('O relatório excede o limite canônico de 50.000 caracteres.')
    }

    const patient = $app.findRecordById('pacientes', body.pacienteId)
    if (patient.getString('usuario_id') !== e.auth.id) {
      throw new ForbiddenError('Paciente fora do contexto autenticado.')
    }

    const serverSourceFingerprint = $security.sha256(body.sourceCanonical)
    if (serverSourceFingerprint !== body.sourceFingerprint) {
      throw new BadRequestError('Fingerprint da fonte não corresponde ao payload canônico.')
    }

    const expectedReportFingerprint = $security.sha256(
      JSON.stringify({
        engineVersion: body.engineVersion,
        profile: body.profile,
        reportMarkdown: body.conteudo,
        schemaVersion: 'NS-CR-1.0',
        sourceFingerprint: serverSourceFingerprint,
      }),
    )
    if (expectedReportFingerprint !== body.reportFingerprint) {
      throw new BadRequestError('Fingerprint do relatório não corresponde ao conteúdo.')
    }

    const existing = $app.findRecordsByFilter(
      'quick_reports',
      'usuario_id = {:userId} && submission_key = {:submissionKey}',
      '-created',
      1,
      0,
      { userId: e.auth.id, submissionKey: body.submissionKey },
    )
    if (existing.length > 0) {
      const prior = existing[0]
      const priorEvents = $app.findRecordsByFilter(
        'clinical_commit_events',
        'report_id = {:reportId}',
        '-timestamp',
        1,
        0,
        { reportId: prior.id },
      )
      if (priorEvents.length === 0) {
        throw new InternalServerError('Clinical Commit existente sem evento de auditoria.')
      }
      return e.json(200, {
        reportId: prior.id,
        auditEventId: priorEvents[0].id,
        version: prior.getInt('version'),
        status: 'CANONICAL_COMMITTED',
        sourceFingerprint: prior.getString('source_fingerprint'),
        reportFingerprint: prior.getString('report_fingerprint'),
        idempotent: true,
      })
    }

    let response = null
    $app.runInTransaction((txApp) => {
      const priorReports = txApp.findRecordsByFilter(
        'quick_reports',
        'paciente_id = {:patientId} && profile = {:profile} && status = "CANONICAL_COMMITTED"',
        '-version',
        1,
        0,
        { patientId: body.pacienteId, profile: body.profile },
      )
      const version = priorReports.length > 0 ? priorReports[0].getInt('version') + 1 : 1
      const timestamp = new Date().toISOString()

      const reportCollection = txApp.findCollectionByNameOrId('quick_reports')
      const report = new Record(reportCollection)
      report.set('usuario_id', e.auth.id)
      report.set('paciente_id', body.pacienteId)
      report.set('titulo', body.titulo.trim())
      report.set('conteudo', body.conteudo)
      report.set('status', 'CANONICAL_COMMITTED')
      report.set('version', version)
      report.set('profile', body.profile)
      report.set('source_fingerprint', serverSourceFingerprint)
      report.set('report_fingerprint', expectedReportFingerprint)
      report.set('engine_version', body.engineVersion)
      report.set('review_decision', 'APPROVED')
      report.set('reviewed_at', timestamp)
      report.set('reviewed_by', e.auth.id)
      report.set('provenance', body.provenance || {})
      report.set('context_snapshot', body.contextSnapshot || {})
      report.set('canonical_at', timestamp)
      report.set('submission_key', body.submissionKey)
      txApp.save(report)

      const existingHeads = txApp.findRecordsByFilter(
        'quick_report_heads',
        'usuario_id = {:userId} && paciente_id = {:patientId} && profile = {:profile}',
        '',
        1,
        0,
        { userId: e.auth.id, patientId: body.pacienteId, profile: body.profile },
      )
      const headCollection = txApp.findCollectionByNameOrId('quick_report_heads')
      const head = existingHeads.length > 0 ? existingHeads[0] : new Record(headCollection)
      head.set('usuario_id', e.auth.id)
      head.set('paciente_id', body.pacienteId)
      head.set('report_id', report.id)
      head.set('profile', body.profile)
      head.set('version', version)
      head.set('report_fingerprint', expectedReportFingerprint)
      txApp.save(head)

      const previousEvents = txApp.findRecordsByFilter(
        'clinical_commit_events',
        'paciente_id = {:patientId}',
        '-timestamp',
        1,
        0,
        { patientId: body.pacienteId },
      )
      const previousHash =
        previousEvents.length > 0 ? previousEvents[0].getString('event_hash') : ''
      const eventHash = $security.sha256(
        JSON.stringify({
          actorId: e.auth.id,
          eventType: 'CANONICAL_REPORT_COMMITTED',
          pacienteId: body.pacienteId,
          previousEventHash: previousHash,
          reportFingerprint: expectedReportFingerprint,
          reportId: report.id,
          timestamp,
          version,
        }),
      )

      const eventCollection = txApp.findCollectionByNameOrId('clinical_commit_events')
      const event = new Record(eventCollection)
      event.set('actor_id', e.auth.id)
      event.set('paciente_id', body.pacienteId)
      event.set('report_id', report.id)
      event.set('event_type', 'CANONICAL_REPORT_COMMITTED')
      event.set('previous_event_hash', previousHash)
      event.set('event_hash', eventHash)
      event.set('report_fingerprint', expectedReportFingerprint)
      event.set('metadata', {
        profile: body.profile,
        sourceFingerprint: serverSourceFingerprint,
        schemaVersion: 'NS-CR-1.0',
        version,
      })
      event.set('timestamp', timestamp)
      txApp.save(event)

      response = {
        reportId: report.id,
        auditEventId: event.id,
        version,
        status: 'CANONICAL_COMMITTED',
        sourceFingerprint: serverSourceFingerprint,
        reportFingerprint: expectedReportFingerprint,
        idempotent: false,
      }
    })

    return e.json(201, response)
  },
  $apis.requireAuth(),
)
