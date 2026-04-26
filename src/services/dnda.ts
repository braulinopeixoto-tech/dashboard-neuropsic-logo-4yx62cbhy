import pb from '@/lib/pocketbase/client'

export const createDnda = (data: any) =>
  pb.collection('dnda_schema').create({
    ...data,
    usuario_id: pb.authStore.record?.id,
  })
export const updateDnda = (id: string, data: any) =>
  pb.collection('dnda_schema').update(id, {
    ...data,
    usuario_id: pb.authStore.record?.id,
  })
export const getDnda = (id: string) => pb.collection('dnda_schema').getOne(id)
export const getDndasByPaciente = (pacienteId: string) =>
  pb
    .collection('dnda_schema')
    .getFullList({ filter: `paciente_id = "${pacienteId}"`, sort: '-created' })
