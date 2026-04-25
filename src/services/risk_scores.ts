import pb from '@/lib/pocketbase/client'

export const getRiskScoreByProtocol = async (protocoloId: string) => {
  try {
    return await pb.collection('risk_score').getFirstListItem(`protocolo_id = "${protocoloId}"`)
  } catch (e) {
    return null
  }
}
