import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'

export interface ExportPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  logs: any[]
  filters: {
    startDate?: string
    endDate?: string
    eventType?: string
    userFilter?: string
  }
  kpis: {
    total: number
    integrityRate: number
    alerts: number
  }
}

export function ExportPdfModal({ open, onOpenChange, logs, filters, kpis }: ExportPdfModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState('Relatório de Auditoria')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeTable, setIncludeTable] = useState(true)
  const [signedBy, setSignedBy] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (open) {
      setSignedBy(user?.name || '')
      setTitle('Relatório de Auditoria')
      setIncludeCharts(true)
      setIncludeTable(true)
    }
  }, [open, user])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm:ss')

      let chartsHtml = ''
      if (includeCharts) {
        const svgs = Array.from(document.querySelectorAll('.recharts-surface'))
        chartsHtml = svgs
          .map(
            (svg) => `<div style="margin-bottom: 20px; text-align: center;">${svg.outerHTML}</div>`,
          )
          .join('')
      }

      const tableRows = logs
        .map(
          (log) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${log.expand?.usuario_id?.name || 'Desconhecido'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${log.event_type}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 10px;">${log.hash_sha256?.substring(0, 16) || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${log.integrity_status}</td>
        </tr>
      `,
        )
        .join('')

      const tableHtml = includeTable
        ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; text-align: left;">
              <th style="padding: 8px;">Data</th>
              <th style="padding: 8px;">Usuário</th>
              <th style="padding: 8px;">Evento</th>
              <th style="padding: 8px;">Hash</th>
              <th style="padding: 8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `
        : ''

      const contentToHash = `${title}|${dateStr}|${filters.startDate}|${filters.endDate}|${filters.eventType}|${kpis.total}|${kpis.integrityRate}|${kpis.alerts}|${signedBy}|${logs.length}`

      const encoder = new TextEncoder()
      const data = encoder.encode(contentToHash)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .meta { font-size: 12px; color: #64748b; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
            .grid { display: flex; gap: 20px; margin-bottom: 20px; }
            .card { background: #f8fafc; padding: 16px; border-radius: 8px; flex: 1; border: 1px solid #e2e8f0; }
            .card-value { font-size: 24px; font-weight: bold; margin-top: 8px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
            @media print {
              body { padding: 0; }
              @page { size: A4 portrait; margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="meta">Gerado em: ${dateStr}</div>
            <div class="meta">Assinado por: ${signedBy}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Filtros Aplicados</div>
            <div class="meta">
              Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Hoje'} <br/>
              Evento: ${filters.eventType || 'Todos'} <br/>
              Usuário: ${filters.userFilter || 'Todos'}
            </div>
          </div>

          <div class="section grid">
            <div class="card">
              <div class="meta">Total de Eventos</div>
              <div class="card-value">${kpis.total}</div>
            </div>
            <div class="card">
              <div class="meta">Taxa de Integridade</div>
              <div class="card-value">${kpis.integrityRate.toFixed(1)}%</div>
            </div>
            <div class="card">
              <div class="meta">Alertas</div>
              <div class="card-value">${kpis.alerts}</div>
            </div>
          </div>

          ${
            includeCharts && chartsHtml
              ? `
          <div class="section">
            <div class="section-title">Visualizações</div>
            ${chartsHtml}
          </div>
          `
              : ''
          }

          ${
            includeTable
              ? `
          <div class="section">
            <div class="section-title">Detalhamento de Logs</div>
            ${tableHtml}
          </div>
          `
              : ''
          }

          <div class="footer">
            <p><strong>Certificado de Integridade:</strong> Este documento foi selado com SHA-256.</p>
            <p>Assinatura Digital: ${hashHex}</p>
            <p>Gerado em: ${dateStr}</p>
          </div>
        </body>
        </html>
      `

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)

      const doc = iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()

        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus()
            iframe.contentWindow.onafterprint = () => {
              document.body.removeChild(iframe)
            }
            iframe.contentWindow.print()
            toast({
              title: 'PDF exportado com sucesso',
            })
            onOpenChange(false)
          }
        }, 500)
      } else {
        throw new Error('Não foi possível criar o iframe')
      }
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Configurar Exportação de PDF
          </DialogTitle>
          <DialogDescription>
            Personalize os dados que serão incluídos no relatório selado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título do Relatório</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Relatório de Auditoria LGPD"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCharts"
              checked={includeCharts}
              onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
            />
            <Label htmlFor="includeCharts" className="cursor-pointer">
              Incluir Gráficos e Visualizações
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTable"
              checked={includeTable}
              onCheckedChange={(checked) => setIncludeTable(checked as boolean)}
            />
            <Label htmlFor="includeTable" className="cursor-pointer">
              Incluir Tabela Detalhada de Logs
            </Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signedBy">Assinado por</Label>
            <Input
              id="signedBy"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
              placeholder="Nome do Responsável"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating} className="min-w-[120px]">
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {generating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
