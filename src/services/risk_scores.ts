import pb from '@/lib/pocketbase/client'
import { sealAuditLog } from './audit_log'

export const getRiskScoreByProtocol = async (protocoloId: string) => {
  try {
    return await pb.collection('risk_score').getFirstListItem(`protocolo_id = "${protocoloId}"`)
  } catch (e) {
    return null
  }
}

export const updateVitalScore = async (
  protocoloId: string,
  pacienteId: string,
  userId: string,
  newScore: number,
  reason: string,
) => {
  let riskScore = await getRiskScoreByProtocol(protocoloId)
  let oldScore = 0
  let result

  if (riskScore) {
    oldScore = riskScore.performance_score || 0
    result = await pb.collection('risk_score').update(riskScore.id, { performance_score: newScore })
  } else {
    result = await pb.collection('risk_score').create({
      protocolo_id: protocoloId,
      paciente_id: pacienteId,
      usuario_id: userId,
      performance_score: newScore,
      abandonment_risk: 0,
      adherence_score: 0,
    })
  }

  try {
    await sealAuditLog({
      user_id: userId,
      event_type: 'vital_score',
      action_description: `Vital Score alterado para ${newScore} (anterior: ${oldScore})`,
      payload: {
        paciente_id: pacienteId,
        vital_score_anterior: oldScore,
        vital_score_novo: newScore,
        timestamp: new Date().toISOString(),
        motivo_alteracao: reason,
      },
    })
  } catch (error) {
    console.error('Erro ao registrar Vital Score em auditoria: ', error)
  }

  return result
}
