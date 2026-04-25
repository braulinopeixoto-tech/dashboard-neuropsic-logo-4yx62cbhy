import pb from '@/lib/pocketbase/client'

export async function getAlertas(userId: string) {
  return pb.collection('alertas').getFullList({
    filter: `usuario_id="${userId}"`,
    sort: '-created',
    expand: 'paciente_id',
  })
}

export async function getAlertasNaoLidos(userId: string) {
  return pb.collection('alertas').getFullList({
    filter: `usuario_id="${userId}" && lido=false`,
    sort: '-created',
    expand: 'paciente_id',
  })
}

export async function marcarComoLido(alertaId: string) {
  return pb.collection('alertas').update(alertaId, { lido: true })
}

export async function registrarIntervencaoAlerta(alertaId: string, mensagemAtual: string) {
  return pb.collection('alertas').update(alertaId, {
    lido: true,
    intervencao_realizada: true,
    mensagem: mensagemAtual.includes('Intervenção realizada')
      ? mensagemAtual
      : `${mensagemAtual} (Intervenção realizada)`,
  })
}
