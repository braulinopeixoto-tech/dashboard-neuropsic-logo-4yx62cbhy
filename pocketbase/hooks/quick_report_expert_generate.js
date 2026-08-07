routerAdd(
  'POST',
  '/backend/v1/quick-report/expert-generate',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const rawNarrative = typeof body.rawNarrative === 'string' ? body.rawNarrative.trim() : ''
      const profile = typeof body.profile === 'string' ? body.profile.trim() : 'clinical'
      const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : 'clinical_summary'
      const structuredFacts =
        body.structuredFacts && typeof body.structuredFacts === 'object' ? body.structuredFacts : {}
      const deterministicReport =
        typeof body.deterministicReport === 'string' ? body.deterministicReport : ''

      if (!e.auth?.id) return e.unauthorizedError('Autenticação obrigatória.')
      if (rawNarrative.length < 20) return e.badRequestError('Narrativa insuficiente.')
      if (rawNarrative.length > 30000)
        return e.badRequestError('Narrativa excede 30.000 caracteres.')
      if (deterministicReport.length > 50000) {
        return e.badRequestError('Relatório-base excede 50.000 caracteres.')
      }

      const sourceHash = $security.sha256(rawNarrative)
      const expert = $ai.agent('neurostrata-quick-report-expert').chat({
        user_id: e.auth.id,
        conversation_id: null,
        message: JSON.stringify({
          task: 'Gerar Quick Report DNDA para revisão humana.',
          privacy:
            'Entrada deve estar pseudonimizada. Não reproduza identificadores desnecessários.',
          profile,
          purpose,
          sourceHash,
          rawNarrative,
          structuredFacts,
          deterministicReport,
        }),
      })

      let expertText = String(expert.content || '').trim()
      expertText = expertText
        .replace(/^\x60\x60\x60(?:json)?\s*/i, '')
        .replace(/\s*\x60\x60\x60$/, '')
      const expertStart = expertText.indexOf('{')
      const expertEnd = expertText.lastIndexOf('}')
      if (expertStart < 0 || expertEnd <= expertStart) {
        return e.json(502, {
          code: 'EXPERT_INVALID_RESPONSE',
          error: 'Resposta especialista inválida.',
        })
      }

      let generated
      try {
        generated = JSON.parse(expertText.slice(expertStart, expertEnd + 1))
      } catch (_) {
        return e.json(502, {
          code: 'EXPERT_INVALID_JSON',
          error: 'Resposta especialista não estruturada.',
        })
      }

      if (
        typeof generated.reportMarkdown !== 'string' ||
        generated.reportMarkdown.trim().length < 200
      ) {
        return e.json(502, {
          code: 'EXPERT_REPORT_INCOMPLETE',
          error: 'Relatório especialista incompleto.',
        })
      }
      if (generated.reportMarkdown.length > 50000) {
        return e.json(502, {
          code: 'EXPERT_REPORT_TOO_LARGE',
          error: 'Relatório especialista excedeu o limite.',
        })
      }
      if (!Array.isArray(generated.claims)) generated.claims = []
      if (!Array.isArray(generated.attentionCards)) generated.attentionCards = []
      generated.attentionCards = generated.attentionCards.slice(0, 5)
      if (!Array.isArray(generated.sections)) generated.sections = []
      if (!Array.isArray(generated.limitations)) generated.limitations = []
      if (!Array.isArray(generated.memoryInfluence)) generated.memoryInfluence = []

      const critic = $ai.agent('neurostrata-clinical-critic').chat({
        user_id: e.auth.id,
        conversation_id: null,
        message: JSON.stringify({
          task: 'Auditar independentemente o relatório proposto.',
          sourceHash,
          rawNarrative,
          structuredFacts,
          reportMarkdown: generated.reportMarkdown,
          claims: generated.claims,
        }),
      })

      let criticText = String(critic.content || '').trim()
      criticText = criticText
        .replace(/^\x60\x60\x60(?:json)?\s*/i, '')
        .replace(/\s*\x60\x60\x60$/, '')
      const criticStart = criticText.indexOf('{')
      const criticEnd = criticText.lastIndexOf('}')
      if (criticStart < 0 || criticEnd <= criticStart) {
        return e.json(502, {
          code: 'CRITIC_INVALID_RESPONSE',
          error: 'Crítico independente inválido.',
        })
      }

      let criticResult
      try {
        criticResult = JSON.parse(criticText.slice(criticStart, criticEnd + 1))
      } catch (_) {
        return e.json(502, {
          code: 'CRITIC_INVALID_JSON',
          error: 'Crítico independente não estruturado.',
        })
      }

      const outputHash = $security.sha256(generated.reportMarkdown)
      const evidenceManifestId = $security.sha256(
        sourceHash + ':' + outputHash + ':' + expert.message_id + ':' + critic.message_id,
      )
      const expertCitations = Array.isArray(expert.citations) ? expert.citations : []
      const criticCitations = Array.isArray(critic.citations) ? critic.citations : []
      const runtimeStatus =
        criticResult.status === 'PASS' && criticResult.safeForHumanReview === true
          ? 'READY_FOR_HUMAN_REVIEW'
          : 'REPAIR_REQUIRED'

      return e.json(200, {
        runtimeStatus,
        reportMarkdown: generated.reportMarkdown,
        sections: generated.sections,
        claims: generated.claims,
        attentionCards: generated.attentionCards,
        limitations: generated.limitations,
        evidenceQualification: generated.evidenceQualification || 'NARRATIVE_ONLY',
        memoryInfluence: generated.memoryInfluence,
        critic: criticResult,
        trust: {
          evidenceManifestId,
          sourceHash,
          outputHash,
          runtime: 'skip-cloud-agent',
          modelAlias: 'reasoning',
          expertAgent: 'neurostrata-quick-report-expert',
          criticAgent: 'neurostrata-clinical-critic',
          promptVersion: 'NS-QR-EXPERT-1.0',
          expertMessageId: expert.message_id,
          criticMessageId: critic.message_id,
          expertConversationId: expert.conversation_id,
          criticConversationId: critic.conversation_id,
          expertCitations,
          criticCitations,
          generatedAt: new Date().toISOString(),
        },
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, {
          code: 'AI_CONFIG_UNAVAILABLE',
          error: 'AI temporariamente indisponível.',
        })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          code: 'AI_AGENT_ERROR',
          error: status >= 500 ? 'Falha no agente clínico.' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          code: 'AI_GATEWAY_ERROR',
          error: status >= 500 ? 'AI temporariamente indisponível.' : err.message,
        })
      }
      const errorId = $security.randomString(12)
      $app.logger().error('quick report expert runtime failure', 'errorId', errorId)
      return e.json(500, {
        code: 'EXPERT_RUNTIME_FAILURE',
        error: 'Falha interna no runtime especialista.',
        errorId,
      })
    }
  },
  $apis.requireAuth(),
  $apis.bodyLimit(200000),
)
