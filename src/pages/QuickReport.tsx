import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, PlusCircle } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function QuickReport() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pb.collection('quick_reports')
      .getFullList({ expand: 'paciente_id', sort: '-created' })
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quick Reports</h1>
          <p className="text-slate-500 mt-1">
            Anotações clínicas rápidas e observações do tratamento.
          </p>
        </div>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" /> Novo Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <FileText className="h-5 w-5 text-indigo-500" />
                {report.titulo}
              </CardTitle>
              <CardDescription>Paciente: {report.expand?.paciente_id?.nome}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 line-clamp-3">{report.conteudo}</p>
              <p className="text-xs text-slate-400 mt-4">
                {new Date(report.created).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border rounded-lg border-dashed bg-white">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p>Nenhum Quick Report encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
