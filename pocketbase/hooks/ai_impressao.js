routerAdd(
  'POST',
  '/backend/v1/ai/impressao',
  (e) => {
    const body = e.requestInfo().body || {}
    const paciente_id = body.paciente_id
    if (!paciente_id) return e.badRequestError('Missing paciente_id')

    const prompt = `Você é um assistente de neuropsicologia experiente. Gere uma impressão clínica preliminar sucinta, em texto narrativo, integrando os dados da avaliação abaixo:
Queixa estruturada: ${JSON.stringify(body.queixa || {})}
Resumo da história clínica: ${body.resumo || 'N/A'}
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
    $app.save(record)

    return e.json(200, { impressao: content })
  },
  $apis.requireAuth(),
)
