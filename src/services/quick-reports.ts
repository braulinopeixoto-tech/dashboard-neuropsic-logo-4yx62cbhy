import pb from '@/lib/pocketbase/client'

export interface QuickReportData {
  paciente_id: string
  titulo: string
  conteudo: string
}

export const createQuickReport = async (data: QuickReportData) => {
  if (!data.titulo?.trim()) {
    throw new Error('O título do relatório rápido é obrigatório.')
  }

  if (!data.conteudo?.trim()) {
    throw new Error('O conteúdo do relatório rápido é obrigatório.')
  }

  return pb.collection('quick_reports').create({
    usuario_id: pb.authStore.record?.id,
    paciente_id: data.paciente_id,
    titulo: data.titulo.trim(),
    conteudo: data.conteudo.trim(),
  })
}

export const getQuickReports = async (paciente_id: string) => {
  return pb.collection('quick_reports').getFullList({
    filter: `paciente_id="${paciente_id}"`,
    sort: '-created',
    expand: 'usuario_id',
  })
}
