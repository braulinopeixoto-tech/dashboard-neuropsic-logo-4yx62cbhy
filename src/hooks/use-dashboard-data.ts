import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useDashboardData() {
  const [protocolos, setProtocolos] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [allAlertas, setAllAlertas] = useState<any[]>([])

  const load = async () => {
    try {
      const prots = await pb
        .collection('protocolos')
        .getFullList({ expand: 'paciente_id', sort: '-created' })
      const sess = await pb.collection('sessoes').getFullList()
      const alts = await pb.collection('alertas').getFullList({ expand: 'paciente_id' })
      setProtocolos(prots)
      setSessoes(sess)
      setAlertas(alts.filter((a) => !a.lido))
      setAllAlertas(alts)
    } catch (e) {
      console.error('Falha ao carregar os dados do dashboard', e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useRealtime('protocolos', () => {
    pb.collection('protocolos')
      .getFullList({ expand: 'paciente_id', sort: '-created' })
      .then(setProtocolos)
  })
  useRealtime('sessoes', () => {
    pb.collection('sessoes').getFullList().then(setSessoes)
  })
  useRealtime('alertas', () => {
    pb.collection('alertas')
      .getFullList({ expand: 'paciente_id' })
      .then((alts) => {
        setAlertas(alts.filter((a) => !a.lido))
        setAllAlertas(alts)
      })
  })

  return { protocolos, sessoes, alertas, allAlertas }
}
