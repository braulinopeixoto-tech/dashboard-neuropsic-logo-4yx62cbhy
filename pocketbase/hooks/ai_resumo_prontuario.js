routerAdd(
  'POST',
  '/backend/v1/ai-resumo-prontuario',
  (e) => {
    const body = e.requestInfo().body || {}
    const pacienteId = body.pacienteId
    const section = body.section

    if (!pacienteId) return e.badRequestError('pacienteId is required')

    const paciente = $app.findRecordById('pacientes', pacienteId)

    let contextData = {}
    contextData.paciente = {
      nome: paciente.getString('nome'),
      idade: paciente.getString('data_nascimento'),
      queixa: paciente.getString('queixa_principal'),
      exames: paciente.getString('exames') ? 'Possui exames anexados' : 'Sem exames',
    }

    try {
      const anamneses = $app.findRecordsByFilter(
        'anamneses',
        `paciente_id='${pacienteId}'`,
        '-created',
        1,
        0,
      )
      if (anamneses.length > 0) {
        contextData.anamnese = {
          queixa_estruturada: anamneses[0].get('queixa_estruturada'),
          historia_resumo: anamneses[0].getString('historia_resumo'),
        }
      }
    } catch (_) {}

    try {
      const dndas = $app.findRecordsByFilter(
        'dnda_schema',
        `paciente_id='${pacienteId}'`,
        '-created',
        1,
        0,
      )
      if (dndas.length > 0) {
        contextData.dnda = {
          classification: dndas[0].getString('classification'),
          risk_level: dndas[0].getString('risk_level'),
          convergence_score: dndas[0].getFloat('convergence_score'),
        }
      }
    } catch (_) {}

    try {
      const protocolos = $app.findRecordsByFilter(
        'protocolos',
        `paciente_id='${pacienteId}'`,
        '-created',
        10,
        0,
      )
      contextData.protocolos = protocolos.map((p) => ({
        tipo: p.getString('tipo'),
        status: p.getString('status'),
        sessoes_concluidas: p.getInt('sessoes_concluidas'),
        total_sessoes: p.getInt('total_sessoes'),
      }))
    } catch (_) {}

    try {
      const sessoes = $app.findRecordsByFilter(
        'sessoes',
        `paciente_id='${pacienteId}'`,
        '-created',
        5,
        0,
      )
      contextData.ultimas_sessoes = sessoes.map((s) => ({
        numero: s.getInt('numero_sessao'),
        status: s.getString('status'),
        observacoes: s.getString('observacoes'),
      }))
    } catch (_) {}

    try {
      const alertas = $app.findRecordsByFilter(
        'alertas',
        `paciente_id='${pacienteId}'`,
        '-created',
        5,
        0,
      )
      contextData.alertas = alertas.map((a) => ({
        mensagem: a.getString('mensagem'),
        tipo: a.getString('tipo'),
        lido: a.getBool('lido'),
      }))
    } catch (_) {}

    let prompt = `Você é um assistente de neuropsicologia. Sintetize os dados clínicos do paciente em um resumo estruturado.
Dados do paciente:
${JSON.stringify(contextData)}

`

    if (section) {
      prompt += `Gere APENAS a seção: ${section}. Responda com um texto claro e objetivo e sem aspas no início/fim.`
    } else {
      prompt += `
Responda EXATAMENTE no seguinte formato JSON (sem blocos de código markdown):
{
  "identificacao": "Identificação do paciente",
  "queixa": "Queixa principal",
  "historia": "História clínica resumida",
  "dnda": "Achados DNDA™",
  "protocolos": "Protocolos em andamento",
  "progresso": "Progresso e aderência",
  "alertas": "Alertas críticos",
  "recomendacoes": "Recomendações"
}`
    }

    let apiKey = $secrets.get('OPENAI_API_KEY')
    let url = 'https://api.openai.com/v1/chat/completions'

    if (!apiKey) {
      apiKey = $secrets.get('SKIP_LLM_KEY') || ''
      url = 'https://router.skip.dev/llm/v1/chat/completions'
    }

    const res = $http.send({
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: section ? undefined : { type: 'json_object' },
      }),
      timeout: 45,
    })

    if (res.statusCode !== 200) {
      return e.internalServerError(
        'Falha ao gerar resumo na IA: ' + JSON.stringify(res.json || res.raw),
      )
    }

    const aiContent = res.json.choices[0].message.content
    const tokens = res.json.usage.total_tokens

    let parsedData = null
    if (!section) {
      try {
        parsedData = JSON.parse(aiContent)
      } catch (err) {
        parsedData = {
          identificacao: aiContent,
          queixa: '',
          historia: '',
          dnda: '',
          protocolos: '',
          progresso: '',
          alertas: '',
          recomendacoes: '',
        }
      }
    }

    const interCollection = $app.findCollectionByNameOrId('ai_interactions')
    const interaction = new Record(interCollection)
    interaction.set('usuario_id', e.auth?.id || '')
    interaction.set('paciente_id', pacienteId)
    interaction.set('tipo_interacao', 'resumo')
    interaction.set('prompt_context', prompt.substring(0, 3000))
    interaction.set('response_data', section ? { content: aiContent } : parsedData)
    interaction.set('confidence_level', 0.95)
    interaction.set('model', 'gpt-4o-mini')
    interaction.set('tokens_used', tokens)
    $app.save(interaction)

    return e.json(200, {
      result: section ? aiContent.trim() : parsedData,
    })
  },
  $apis.requireAuth(),
)
