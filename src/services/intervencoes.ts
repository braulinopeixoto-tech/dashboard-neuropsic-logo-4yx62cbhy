import pb from '@/lib/pocketbase/client'

export const getIntervencoes = (pacienteId: string) =>
  pb
    .collection('intervencoes')
    .getFullList({ filter: `paciente_id = "${pacienteId}"`, sort: '-data_intervencao' })

export const createIntervencao = (data: {
  usuario_id: string
  paciente_id: string
  tipo: string
  descricao: string
  data_intervencao: string
}) => pb.collection('intervencoes').create(data)
