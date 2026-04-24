routerAdd('OPTIONS', '/backend/v1/sync-google-calendar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Headers', 'authorization, apikey, content-type')
  return e.noContent(204)
})

routerAdd(
  'POST',
  '/backend/v1/sync-google-calendar',
  (e) => {
    e.response.header().set('Access-Control-Allow-Origin', '*')

    try {
      const body = e.requestInfo().body || {}
      const protocolo_id = body.protocolo_id
      const datas = body.datas

      if (!protocolo_id || typeof protocolo_id !== 'string') {
        return e.badRequestError('protocolo_id inválido.')
      }
      if (!Array.isArray(datas) || datas.length === 0) {
        return e.badRequestError('datas inválidas.')
      }

      const protocolo = $app.findRecordById('protocolos', protocolo_id)
      $app.expandRecord(protocolo, ['paciente_id'])
      const paciente = protocolo.expandedOne('paciente_id')

      if (!paciente) {
        return e.badRequestError('Paciente não encontrado.')
      }

      const pacienteNome = paciente.getString('nome')
      const protocoloTipo = protocolo.getString('tipo')
      const intervalo = protocolo.getInt('intervalo_minimo_minutos')

      const apiKey = $secrets.get('GOOGLE_CALENDAR_API_KEY') || ''
      const calendarId = 'primary'

      const event_ids = []

      for (let i = 0; i < datas.length; i++) {
        const dateStr = datas[i]
        const date = new Date(dateStr)
        // Set to 14:00 UTC
        date.setUTCHours(14, 0, 0, 0)
        const endDate = new Date(date.getTime() + 60 * 60 * 1000)

        const event = {
          summary: `Sessão ${i + 1} — ${pacienteNome}`,
          description: `Protocolo ${protocoloTipo}, Intervalo mínimo: ${intervalo} minutos`,
          start: { dateTime: date.toISOString() },
          end: { dateTime: endDate.toISOString() },
        }

        let attempt = 0
        let success = false
        const delays = [2000, 4000, 8000]

        while (attempt < 4 && !success) {
          const res = $http.send({
            url: `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
            timeout: 15,
          })

          if (res.statusCode === 200 || res.statusCode === 201) {
            success = true
            if (res.json && res.json.id) {
              event_ids.push(res.json.id)
            } else {
              event_ids.push(`mock-id-${i}`)
            }
          } else if (res.statusCode === 503 && attempt < 3) {
            const end = Date.now() + delays[attempt]
            while (Date.now() < end) {}
            attempt++
          } else {
            // Break without retry on 400, 401, 404, or after max retries
            break
          }
        }
      }

      return e.json(200, { data: { event_ids } })
    } catch (err) {
      $app.logger().error('Calendar sync error', 'error', String(err))
      return e.json(500, {
        error: 'Não foi possível sincronizar com Google Calendar. Tente novamente.',
      })
    }
  },
  $apis.requireAuth(),
)
