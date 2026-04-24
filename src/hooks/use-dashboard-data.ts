import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

export function useDashboardData() {
  const { user } = useAuth()
  const [protocolos, setProtocolos] = useState<any[]>([])
  const [sessoes, setSessoes] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [allAlertas, setAllAlertas] = useState<any[]>([])

  const load = async () => {
    if (!user) {
      setProtocolos([])
      setSessoes([])
      setAlertas([])
      setAllAlertas([])
      return
    }
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
  }, [user])

  useRealtime(
    'protocolos',
    () => {
      if (!user) return
      pb.collection('protocolos')
        .getFullList({ expand: 'paciente_id', sort: '-created' })
        .then(setProtocolos)
    },
    !!user,
  )
  useRealtime(
    'sessoes',
    () => {
      if (!user) return
      pb.collection('sessoes').getFullList().then(setSessoes)
    },
    !!user,
  )
  useRealtime(
    'alertas',
    () => {
      if (!user) return
      pb.collection('alertas')
        .getFullList({ expand: 'paciente_id' })
        .then((alts) => {
          setAlertas(alts.filter((a) => !a.lido))
          setAllAlertas(alts)
        })
    },
    !!user,
  )

  return { protocolos, sessoes, alertas, allAlertas }
}
