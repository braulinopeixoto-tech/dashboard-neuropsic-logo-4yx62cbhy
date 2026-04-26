routerAdd(
  'POST',
  '/backend/v1/ai/impressao',
  (e) => {
    const body = e.requestInfo().body || {}
    const paciente_id = body.paciente_id
    if (!paciente_id) return e.badRequestError('Missing paciente_id')

    const prompt = `Baseado na queixa, história e exame físico, gere uma impressão clínica preliminar em português. Estruture em: achados principais, hipóteses diagnósticas, recomendações iniciais.
Queixa estruturada: ${JSON.stringify(body.queixa || {})}
História resumida: ${body.resumo || 'N/A'}
Exame físico e psíquico: ${JSON.stringify(body.exame_fisico || {})}`

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
        temperature: 0.4,
      }),
      timeout: 30,
    })

    if (res.statusCode !== 200) {
      $app.logger().error('OpenAI erro na impressão', 'status', res.statusCode, 'body', res.json)
      return e.internalServerError('Erro ao processar IA')
    }

    const content = res.json.choices[0].message.content.trim()

    const col = $app.findCollectionByNameOrId('ai_interactions')
    const record = new Record(col)
    record.set('usuario_id', e.auth.id)
    record.set('paciente_id', paciente_id)
    record.set('tipo_interacao', 'impressao')
    record.set('prompt_context', prompt)
    record.set('response_data', { impressao: content })
    record.set('confidence_level', 0.85)
    record.set('model', res.json.model || 'gpt-4o-mini')
    record.set('tokens_used', res.json.usage?.total_tokens || 0)
    $app.save(record)

    const colSummary = $app.findCollectionByNameOrId('ai_summaries')
    const summary = new Record(colSummary)
    summary.set('usuario_id', e.auth.id)
    summary.set('paciente_id', paciente_id)
    summary.set('tipo', 'impressao_clinica')
    summary.set('conteudo', content)
    summary.set('versao', 1)
    $app.save(summary)

    return e.json(200, { impressao: content })
  },
  $apis.requireAuth(),
)
