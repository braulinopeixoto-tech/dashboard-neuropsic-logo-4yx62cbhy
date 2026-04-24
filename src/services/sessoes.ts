import pb from '@/lib/pocketbase/client'

export async function getSessoesHoje(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayStr = today.toISOString().replace('T', ' ')
  const tomorrowStr = tomorrow.toISOString().replace('T', ' ')

  const sessoes = await pb.collection('sessoes').getFullList({
    filter: `usuario_id="${userId}" && data_agendada >= "${todayStr}" && data_agendada < "${tomorrowStr}"`,
    expand: 'paciente_id,protocolo_id,usuario_id',
    sort: 'data_agendada',
  })

  const protocoloIds = [...new Set(sessoes.map((s) => s.protocolo_id))]

  const lastSessoes = await Promise.all(
    protocoloIds.map(async (pid) => {
      try {
        return await pb
          .collection('sessoes')
          .getFirstListItem(`protocolo_id="${pid}" && status="realizada"`, {
            sort: '-data_realizada',
          })
      } catch {
        return null
      }
    }),
  )

  return sessoes.map((s) => {
    const lastSessao = lastSessoes.find((ls) => ls && ls.protocolo_id === s.protocolo_id)
    return { ...s, lastSessao }
  })
}

export async function getSuggestedSlots(sessao: any) {
  return new Promise<Date[]>((resolve) => {
    setTimeout(() => {
      const slots: Date[] = []
      let baseDate = new Date()
      // Começar sugerindo para o dia seguinte
      baseDate.setDate(baseDate.getDate() + 1)
      baseDate.setHours(9, 0, 0, 0)

      for (let i = 0; i < 5; i++) {
        const slot = new Date(baseDate)
        slot.setHours(9 + i * 2)
        slots.push(slot)
      }
      resolve(slots)
    }, 1000)
  })
}

export async function remarcarSessaoCascade(sessao: any, novaData: Date, usuarioId: string) {
  const oldDate = sessao.data_agendada ? new Date(sessao.data_agendada) : new Date()
  const diffMs = novaData.getTime() - oldDate.getTime()

  await pb.collection('sessoes').update(sessao.id, {
    data_agendada: novaData.toISOString(),
    status: 'agendada',
    observacoes: sessao.observacoes ? sessao.observacoes + '\n[Remarcada]' : '[Remarcada]',
  })

  const subsequent = await pb.collection('sessoes').getFullList({
    filter: `protocolo_id="${sessao.protocolo_id}" && numero_sessao > ${sessao.numero_sessao}`,
    sort: 'numero_sessao',
  })

  for (const sub of subsequent) {
    if (sub.data_agendada) {
      const oldSubDate = new Date(sub.data_agendada)
      const newSubDate = new Date(oldSubDate.getTime() + diffMs)
      await pb.collection('sessoes').update(sub.id, {
        data_agendada: newSubDate.toISOString(),
      })
    }
  }

  try {
    await pb.send('/backend/v1/sync-google-calendar', {
      method: 'POST',
      body: JSON.stringify({
        sessao_id: sessao.id,
        nova_data: novaData.toISOString(),
      }),
    })
  } catch (e) {
    console.error('Google Calendar sync falhou', e)
  }

  const paciente =
    sessao.expand?.paciente_id ||
    (await pb
      .collection('pacientes')
      .getOne(sessao.paciente_id)
      .catch(() => null))
  if (paciente?.telefone) {
    try {
      await pb.send('/backend/v1/send-whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          telefone: paciente.telefone,
          tipo: 'confirmacao',
          dados: {
            nome_paciente: paciente.nome,
            data_sessao:
              novaData.toLocaleDateString('pt-BR') +
              ' às ' +
              novaData.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        }),
      })
    } catch (e) {
      console.error('WhatsApp sync falhou', e)
    }
  }
}

export async function checkReacPause(sessao: any, novaData: Date, usuarioId: string) {
  const tipo = sessao.expand?.protocolo_id?.tipo
  if (tipo !== 'REAC') return false

  let last = sessao.lastSessao
  if (!last) {
    last = await pb
      .collection('sessoes')
      .getFirstListItem(`protocolo_id="${sessao.protocolo_id}" && status="realizada"`, {
        sort: '-data_realizada',
      })
      .catch(() => null)
  }

  if (!last || !last.data_realizada) return false

  const diffDays =
    (novaData.getTime() - new Date(last.data_realizada).getTime()) / (1000 * 3600 * 24)
  if (diffDays > 15) {
    await pb.collection('alertas').create({
      usuario_id: usuarioId,
      paciente_id: sessao.paciente_id,
      tipo: 'pausa_excedida',
      mensagem: `A pausa excedeu 15 dias. É recomendado reiniciar o ciclo. Sessão ${sessao.numero_sessao}.`,
      lido: false,
    })
    return true
  }
  return false
}

export async function registrarExecucao(
  sessaoId: string,
  observacoes: string,
  pacienteId: string,
  usuarioId: string,
  status: 'realizada' | 'faltou' = 'realizada',
) {
  const now = new Date().toISOString()

  await pb.collection('sessoes').update(sessaoId, {
    status: status,
    data_realizada: status === 'realizada' ? now : '',
    observacoes,
  })

  if (observacoes && observacoes.trim().length > 0) {
    await pb.collection('alertas').create({
      usuario_id: usuarioId,
      paciente_id: pacienteId,
      tipo: 'observacao_clinica',
      mensagem: `Observação: ${observacoes.substring(0, 150)}`,
      lido: false,
    })
  }
}

export async function ensureMockDataForToday(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().replace('T', ' ')

  const count = await pb.collection('sessoes').getList(1, 1, {
    filter: `usuario_id="${userId}" && data_agendada >= "${todayStr}"`,
  })

  if (count.totalItems > 0) return

  const tipos = ['REAC', 'REAC', 'tDCS', 'tDCS', 'tACS', 'tACS']
  for (let i = 0; i < 6; i++) {
    const pac = await pb.collection('pacientes').create({
      usuario_id: userId,
      nome: `Paciente Mock ${i + 1}`,
      unidade: i % 2 === 0 ? 'Matriz' : 'Filial Norte',
      ativo: true,
    })

    const prot = await pb.collection('protocolos').create({
      usuario_id: userId,
      paciente_id: pac.id,
      tipo: tipos[i],
      total_sessoes: 10,
      intervalo_minimo_minutos: 60,
      status: 'ativo',
    })

    const pastDate = new Date()
    if (i % 2 === 0) {
      pastDate.setMinutes(pastDate.getMinutes() - 45)
    } else {
      pastDate.setDate(pastDate.getDate() - 1)
    }

    await pb.collection('sessoes').create({
      usuario_id: userId,
      paciente_id: pac.id,
      protocolo_id: prot.id,
      numero_sessao: 1,
      status: 'realizada',
      data_realizada: pastDate.toISOString(),
    })

    const sessionDate = new Date()
    sessionDate.setHours(8 + i * 2, 0, 0, 0)
    await pb.collection('sessoes').create({
      usuario_id: userId,
      paciente_id: pac.id,
      protocolo_id: prot.id,
      numero_sessao: 2,
      status: 'agendada',
      data_agendada: sessionDate.toISOString(),
    })
  }
}
