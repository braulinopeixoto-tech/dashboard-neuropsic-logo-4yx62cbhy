routerAdd(
  'POST',
  '/backend/v1/ai/resumo',
  (e) => {
    const body = e.requestInfo().body || {}
    const paciente_id = body.paciente_id
    if (!paciente_id) return e.badRequestError('Missing paciente_id')

    const prompt = `Você é um assistente de neuropsicologia. Crie um resumo narrativo profissional em português baseado nos dados clínicos fornecidos:
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
    $app.save(record)

    return e.json(200, { resumo: content })
  },
  $apis.requireAuth(),
)
