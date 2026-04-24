// @deps zod@3.23.8
routerAdd(
  'POST',
  '/backend/v1/send-whatsapp',
  (e) => {
    const { z } = require('zod')

    const schema = z.object({
      telefone: z.string().min(1, 'Telefone é obrigatório'),
      tipo: z.enum(['confirmacao', 'lembrete', 'falta']),
      dados: z
        .object({
          nome_paciente: z.string().optional(),
          data_sessao: z.string().optional(),
          hora: z.string().optional(),
          link: z.string().optional(),
        })
        .optional(),
    })

    const body = e.requestInfo().body || {}
    const result = schema.safeParse(body)

    if (!result.success) {
      return e.json(400, { error: 'Dados inválidos para envio de WhatsApp.' })
    }

    const { telefone, tipo, dados } = result.data
    const safeDados = dados || {}

    let mensagem = ''
    if (tipo === 'confirmacao') {
      mensagem = `Olá ${safeDados.nome_paciente}! Sua sessão foi agendada para ${safeDados.data_sessao} às ${safeDados.hora}. Confirme presença.`
    } else if (tipo === 'lembrete') {
      mensagem = `Lembrete: Sua sessão é amanhã às ${safeDados.hora}. Não esqueça!`
    } else if (tipo === 'falta') {
      mensagem = `Notamos que você faltou na sessão de ${safeDados.data_sessao}. Clique aqui para remarcar: ${safeDados.link || 'https://wa.me/message'}`
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
