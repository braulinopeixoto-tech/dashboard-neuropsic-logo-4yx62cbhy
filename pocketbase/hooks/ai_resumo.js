routerAdd(
  'POST',
  '/backend/v1/ai/resumo',
  (e) => {
    const body = e.requestInfo().body || {}
    const paciente_id = body.paciente_id
    if (!paciente_id) return e.badRequestError('Missing paciente_id')

    const prompt = `Resuma a seguinte história clínica em 3-4 parágrafos narrativos em português. Mantenha informações críticas.
Antecedentes pessoais: ${body.pessoais || 'Nenhum'}
Antecedentes familiares: ${body.familiares || 'Nenhum'}
Medicações: ${(body.medicacoes || []).join(', ') || 'Nenhuma'}
Alergias: ${(body.alergias || []).join(', ') || 'Nenhuma'}
Cirurgias: ${(body.cirurgias || []).join(', ') || 'Nenhuma'}
Traumas: ${body.traumas || 'Nenhum'}
Perdas: ${body.perdas || 'Nenhuma'}`

    const res = $http.send({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + $secrets.get('OPENAI_API_KEY'),
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
      timeout: 30,
    })

    if (res.statusCode !== 200) {
      $app.logger().error('OpenAI erro no resumo', 'status', res.statusCode, 'body', res.json)
      return e.internalServerError('Erro ao processar IA')
    }

    const content = res.json.choices[0].message.content.trim()

    const col = $app.findCollectionByNameOrId('ai_interactions')
    const record = new Record(col)
    record.set('usuario_id', e.auth.id)
    record.set('paciente_id', paciente_id)
    record.set('tipo_interacao', 'resumo')
    record.set('prompt_context', prompt)
    record.set('response_data', { resumo: content })
    record.set('confidence_level', 0.9)
    record.set('model', res.json.model || 'gpt-4o-mini')
    record.set('tokens_used', res.json.usage?.total_tokens || 0)
    $app.save(record)

    const colSummary = $app.findCollectionByNameOrId('ai_summaries')
    const summary = new Record(colSummary)
    summary.set('usuario_id', e.auth.id)
    summary.set('paciente_id', paciente_id)
    summary.set('tipo', 'historia_clinica')
    summary.set('conteudo', content)
    summary.set('versao', 1)
    $app.save(summary)

    return e.json(200, { resumo: content })
  },
  $apis.requireAuth(),
)
