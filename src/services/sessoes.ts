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

export async function registrarExecucao(
  sessaoId: string,
  observacoes: string,
  pacienteId: string,
  usuarioId: string,
) {
  const now = new Date().toISOString()

  await pb.collection('sessoes').update(sessaoId, {
    status: 'realizada',
    data_realizada: now,
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
