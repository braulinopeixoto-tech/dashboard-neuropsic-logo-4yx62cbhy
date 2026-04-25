import pb from '@/lib/pocketbase/client'

export const createDnda = (data: any) => pb.collection('dnda').create(data)
export const getDndasByPaciente = (pacienteId: string) =>
  pb.collection('dnda').getFullList({ filter: `paciente_id = "${pacienteId}"`, sort: '-created' })
