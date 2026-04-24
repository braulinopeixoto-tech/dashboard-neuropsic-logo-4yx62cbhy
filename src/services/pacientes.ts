import pb from '@/lib/pocketbase/client'

export const getPaciente = (id: string) => pb.collection('pacientes').getOne(id)

export const getProtocolos = (pacienteId: string) =>
  pb
    .collection('protocolos')
    .getFullList({ filter: `paciente_id = "${pacienteId}"`, sort: '-created' })

export const getSessoes = (pacienteId: string) =>
  pb
    .collection('sessoes')
    .getFullList({ filter: `paciente_id = "${pacienteId}"`, sort: '-data_agendada' })
