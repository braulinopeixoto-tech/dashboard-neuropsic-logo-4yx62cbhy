import pb from '@/lib/pocketbase/client'

export async function getRelatorioData(pacienteId: string) {
  const [paciente, sessoes, protocolos, intervencoes, dndas, riskScores] = await Promise.all([
    pb.collection('pacientes').getOne(pacienteId),
    pb
      .collection('sessoes')
      .getFullList({ filter: `paciente_id="${pacienteId}"`, sort: '-data_agendada' }),
    pb
      .collection('protocolos')
      .getFullList({ filter: `paciente_id="${pacienteId}"`, sort: '-created' }),
    pb
      .collection('intervencoes')
      .getFullList({ filter: `paciente_id="${pacienteId}"`, sort: '-data_intervencao' }),
    pb
      .collection('dnda_schema')
      .getFullList({ filter: `paciente_id="${pacienteId}"`, sort: 'timestamp' }),
    pb
      .collection('risk_score')
      .getFullList({ filter: `paciente_id="${pacienteId}"`, sort: '-created' }),
  ])

  let auditLogs: any[] = []
  if (protocolos.length > 0) {
    try {
      const pIds = protocolos.map((p) => `entity_id="${p.id}"`).join(' || ')
      auditLogs = await pb.collection('audit_log').getFullList({
        filter: `entity_type="protocolo" && (${pIds})`,
        sort: '-created',
      })
    } catch (e) {
      console.error('Erro ao buscar audit logs de protocolo', e)
    }
  }

  let latestAudit = null
  try {
    const res = await pb.collection('audit_log').getList(1, 1, { sort: '-created' })
    latestAudit = res.items[0] || null
  } catch (e) {
    console.error('Erro ao buscar ultimo audit log', e)
  }

  return { paciente, sessoes, protocolos, intervencoes, dndas, riskScores, auditLogs, latestAudit }
}
