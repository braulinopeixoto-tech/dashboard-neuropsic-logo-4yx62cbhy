import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Stethoscope, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function GestaoClinica() {
  const { user } = useAuth()
  const [equipe, setEquipe] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('users')
      .getFullList({ filter: 'ativo=true' })
      .then(setEquipe)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const unidades = [
    { nome: 'Unidade Centro', status: 'Operacional', capacidade: '85%' },
    { nome: 'Unidade Sul', status: 'Operacional', capacidade: '60%' },
    { nome: 'Unidade Norte', status: 'Manutenção', capacidade: '10%' },
  ]

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão Clínica</h1>
        <p className="text-slate-500 mt-1">
          Status operacional das unidades e gestão da equipe clínica.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" /> Unidades
            </CardTitle>
            <CardDescription>Capacidade e status operacional de cada clínica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unidades.map((u) => (
              <div
                key={u.nome}
                className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm transition-hover hover:shadow-md"
              >
                <div>
                  <h4 className="font-semibold text-slate-800">{u.nome}</h4>
                  <p className="text-sm text-slate-500">Ocupação: {u.capacidade}</p>
                </div>
                <Badge
                  variant={u.status === 'Operacional' ? 'default' : 'secondary'}
                  className={
                    u.status === 'Operacional'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : ''
                  }
                >
                  {u.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" /> Equipe Clínica
            </CardTitle>
            <CardDescription>Profissionais ativos no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {equipe.map((membro) => (
              <div
                key={membro.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{membro.name || membro.email}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {membro.tipo?.replace('_', ' ')} &bull; {membro.unidade}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                </Badge>
              </div>
            ))}
            {equipe.length === 0 && (
              <p className="text-slate-500 text-center py-4">Nenhum profissional encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
