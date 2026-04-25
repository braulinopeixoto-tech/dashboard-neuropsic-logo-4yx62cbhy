import pb from '@/lib/pocketbase/client'
import { remarcarSessaoCascade } from './sessoes'

export async function fetchCockpitData() {
  const [riskScores, dndas, protocolos, sessoesAgendadas] = await Promise.all([
    pb.collection('risk_score').getFullList({ expand: 'paciente_id,protocolo_id' }),
    pb.collection('dnda_schema').getFullList({ expand: 'paciente_id', sort: '-created' }),
    pb
      .collection('protocolos')
      .getFullList({ expand: 'paciente_id', filter: 'status="ativo" || status="pausado"' }),
    pb.collection('sessoes').getFullList({
      filter: 'status="agendada" || status="remarcada"',
      sort: 'data_agendada',
      expand: 'paciente_id,protocolo_id',
    }),
  ])

  return { riskScores, dndas, protocolos, sessoesAgendadas }
}

export async function downgradeRiskLevel(riskScoreId: string, currentLevel: string) {
  const levelMap: Record<string, string> = {
    crítico: 'alto',
    alto: 'moderado',
    moderado: 'baixo',
    baixo: 'baixo',
  }
  const newLevel = levelMap[currentLevel] || 'baixo'
  return pb.collection('risk_score').update(riskScoreId, { alert_level: newLevel })
}

export async function recalcularProtocolo(protocoloId: string, usuarioId: string) {
  const pending = await pb
    .collection('sessoes')
    .getFirstListItem(
      `protocolo_id="${protocoloId}" && (status="agendada" || status="remarcada")`,
      {
        sort: 'numero_sessao',
      },
    )
    .catch(() => null)

  if (!pending) throw new Error('Nenhuma sessão pendente encontrada para recalcular.')

  const protocolo = await pb.collection('protocolos').getOne(protocoloId)
  const minInterval = protocolo.intervalo_minimo_minutos || 1440

  const lastRealized = await pb
    .collection('sessoes')
    .getFirstListItem(`protocolo_id="${protocoloId}" && status="realizada"`, {
      sort: '-data_realizada',
    })
    .catch(() => null)

  let novaData = new Date()
  if (lastRealized && lastRealized.data_realizada) {
    novaData = new Date(new Date(lastRealized.data_realizada).getTime() + minInterval * 60000)
  }

  if (novaData < new Date()) {
    novaData = new Date()
    novaData.setDate(novaData.getDate() + 1)
    novaData.setHours(9, 0, 0, 0)
  }

  await remarcarSessaoCascade(pending, novaData, usuarioId)
}
