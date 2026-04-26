routerAdd(
  'POST',
  '/backend/v1/ai/queixa',
  (e) => {
    const body = e.requestInfo().body || {}
    const texto = body.texto || ''
    const paciente_id = body.paciente_id
    if (!texto || !paciente_id) return e.badRequestError('Missing texto or paciente_id')

    const prompt = `Estruture a seguinte queixa clínica em: sintoma principal, duração, intensidade (0-10), fatores desencadeadores, impacto funcional. Responda APENAS em JSON válido, sem blocos de código ou markdown:
{
  "sintoma_principal": "string",
  "duracao": "string",
  "intensidade": number (0-10),
  "fatores_desencadeadores": "string",
  "impacto_funcional": "string"
}
Relato:
"${texto}"`

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
        temperature: 0.2,
      }),
      timeout: 30,
    })

    if (res.statusCode !== 200) {
      $app.logger().error('OpenAI erro na queixa', 'status', res.statusCode, 'body', res.json)
      return e.internalServerError('Erro ao processar IA')
    }

    let content = res.json.choices[0].message.content.trim()
    if (content.startsWith('```json')) {
      content = content
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim()
    } else if (content.startsWith('```')) {
      content = content.replace(/^```/, '').replace(/```$/, '').trim()
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      $app.logger().error('JSON parse failed', 'content', content)
      return e.internalServerError('Erro ao fazer parse do JSON da IA')
    }

    const col = $app.findCollectionByNameOrId('ai_interactions')
    const record = new Record(col)
    record.set('usuario_id', e.auth.id)
    record.set('paciente_id', paciente_id)
    record.set('tipo_interacao', 'queixa')
    record.set('prompt_context', texto)
    record.set('response_data', parsed)
    record.set('confidence_level', 0.95)
    record.set('model', res.json.model || 'gpt-4o-mini')
    record.set('tokens_used', res.json.usage?.total_tokens || 0)
    $app.save(record)

    return e.json(200, parsed)
  },
  $apis.requireAuth(),
)
