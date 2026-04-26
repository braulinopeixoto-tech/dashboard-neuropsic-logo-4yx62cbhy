import pb from '@/lib/pocketbase/client'

export const criarAnamnese = async (data: any) => {
  return pb.collection('anamneses').create({
    ...data,
    usuario_id: pb.authStore.record?.id,
  })
}

export const getAnamneses = async (paciente_id: string) => {
  return pb.collection('anamneses').getFullList({
    filter: `paciente_id = "${paciente_id}"`,
    sort: '-created',
  })
}

export const processarAiQueixa = async (paciente_id: string, texto: string) => {
  return pb.send('/backend/v1/ai/queixa', {
    method: 'POST',
    body: JSON.stringify({ paciente_id, texto }),
  })
}

export const processarAiResumo = async (paciente_id: string, dados: any) => {
  return pb.send('/backend/v1/ai/resumo', {
    method: 'POST',
    body: JSON.stringify({ paciente_id, ...dados }),
  })
}

export const processarAiImpressao = async (paciente_id: string, dados: any) => {
  return pb.send('/backend/v1/ai/impressao', {
    method: 'POST',
    body: JSON.stringify({ paciente_id, ...dados }),
  })
}
