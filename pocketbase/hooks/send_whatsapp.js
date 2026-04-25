routerAdd(
  'POST',
  '/backend/v1/send-whatsapp',
  (e) => {
    // PB automatically handles CORS OPTIONS for all hooks allowing * and standard headers.
    const body = e.requestInfo().body || {}

    if (
      typeof body.telefone !== 'string' ||
      !body.telefone.startsWith('+55') ||
      body.telefone.trim() === ''
    ) {
      return e.json(400, { error: 'Telefone é obrigatório e deve começar com +55.' })
    }

    const validTipos = ['confirmacao', 'lembrete', 'falta']
    if (!validTipos.includes(body.tipo)) {
      return e.json(400, { error: 'Tipo inválido. Deve ser confirmacao, lembrete ou falta.' })
    }

    const dados = body.dados || {}
    if (!dados.nome_paciente || !dados.data_sessao || !dados.hora_sessao) {
      return e.json(400, {
        error: 'Dados incompletos. Requer nome_paciente, data_sessao e hora_sessao.',
      })
    }

    const telefone = body.telefone
    const tipo = body.tipo

    let mensagem = ''
    if (tipo === 'confirmacao') {
      mensagem = `Olá ${dados.nome_paciente}! Sua sessão foi agendada para ${dados.data_sessao} às ${dados.hora_sessao}. Confirme presença.`
    } else if (tipo === 'lembrete') {
      mensagem = `Lembrete: Sua sessão é amanhã às ${dados.hora_sessao}. Não esqueça!`
    } else if (tipo === 'falta') {
      mensagem = `Notamos que você faltou na sessão de ${dados.data_sessao}. Clique aqui para remarcar: ${dados.link || 'https://wa.me/message'}`
    }

    const instanceId = $secrets.get('ZAPI_INSTANCE') || 'mock_instance'
    const token = $secrets.get('ZAPI_TOKEN') || 'mock_token'

    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`
    const payload = JSON.stringify({
      phone: telefone,
      message: mensagem,
    })

    let success = false
    let messageId = null

    // Retry 503 mechanism with backoff: 0, 2s, 4s, 8s
    const delays = [0, 2000, 4000, 8000]

    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) {
        const start = Date.now()
        while (Date.now() - start < delays[i]) {
          // busy wait for backoff
        }
      }

      try {
        $app.logger().info(`Sending WhatsApp to ${telefone}, attempt ${i + 1}`)

        // Simula sucesso se não houver credenciais reais configuradas para evitar erros no ambiente de dev
        if (token === 'mock_token') {
          success = true
          messageId = 'msg_mock_' + $security.randomString(10)
          break
        }

        const res = $http.send({
          url: url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          timeout: 15,
        })

        if (res.statusCode === 200 || res.statusCode === 201) {
          success = true
          messageId = res.json?.messageId || 'msg_' + $security.randomString(10)
          break
        } else if (res.statusCode === 503) {
          $app.logger().warn(`Z-API 503 error on attempt ${i + 1}`)
          // continue to next retry
        } else {
          $app.logger().error(`Z-API error: ${res.statusCode}`, res.json)
          // Não deve tentar novamente para erros 400, 401, 404, etc
          break
        }
      } catch (err) {
        $app.logger().error(`Network error sending WhatsApp: ${err}`)
      }
    }

    if (success) {
      return e.json(200, { data: { message_id: messageId } })
    } else {
      return e.json(500, { error: 'Não foi possível enviar mensagem. Tente novamente.' })
    }
  },
  $apis.requireAuth(),
)
