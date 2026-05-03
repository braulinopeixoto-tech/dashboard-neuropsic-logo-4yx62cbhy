import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Download, Loader2 } from 'lucide-react'

interface ExportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStartDate?: string
  defaultEndDate?: string
  filters?: {
    eventType?: string
    userName?: string
    userId?: string
  }
}

export function ExportCsvModal({
  open,
  onOpenChange,
  defaultStartDate = '',
  defaultEndDate = '',
  filters = {},
}: ExportCsvModalProps) {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [includePayload, setIncludePayload] = useState(false)
  const [includeHashes, setIncludeHashes] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (open) {
      setStartDate(defaultStartDate)
      setEndDate(defaultEndDate)
      setIncludePayload(false)
      setIncludeHashes(false)
    }
  }, [open, defaultStartDate, defaultEndDate])

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return ''
    const s = String(str)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filterStr: string[] = []

      if (filters.eventType && filters.eventType !== 'Todos' && filters.eventType !== 'all') {
        filterStr.push(`event_type="${filters.eventType}"`)
      }
      if (filters.userName && filters.userName !== 'Todos') {
        filterStr.push(`usuario_id.name="${filters.userName}"`)
      }
      if (filters.userId && filters.userId !== 'all') {
        filterStr.push(`usuario_id="${filters.userId}"`)
      }
      if (startDate) {
        filterStr.push(`timestamp >= "${startDate} 00:00:00.000Z"`)
      }
      if (endDate) {
        filterStr.push(`timestamp <= "${endDate} 23:59:59.999Z"`)
      }

      const res = await pb.collection('audit_logs').getFullList({
        filter: filterStr.join(' && '),
        sort: '-timestamp',
        expand: 'usuario_id',
      })

      const headers = [
        'id',
        'user_id',
        'user_name',
        'event_type',
        'action_description',
        'timestamp',
      ]
      if (includeHashes) {
        headers.push('hash_sha256', 'previous_hash')
      }
      headers.push('integrity_status')
      if (includePayload) {
        headers.push('payload')
      }

      const rows = res.map((log) => {
        const row = [
          log.id,
          log.usuario_id || '',
          log.expand?.usuario_id?.name || 'Desconhecido',
          log.event_type,
          log.action_description || '',
          log.timestamp,
        ]
        if (includeHashes) {
          row.push(log.hash_sha256 || '', log.previous_hash || '')
        }
        row.push(log.integrity_status || '')
        if (includePayload) {
          row.push(log.payload ? JSON.stringify(log.payload) : '')
        }
        return row.map(escapeCsv).join(',')
      })

      const csvContent = [headers.join(','), ...rows].join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const formattedDate = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `auditoria_${formattedDate}.csv`

      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Sucesso',
        description: 'CSV exportado com sucesso',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to export CSV:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao gerar CSV. Tente novamente.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Logs (CSV)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-payload"
                checked={includePayload}
                onCheckedChange={(c) => setIncludePayload(!!c)}
              />
              <Label htmlFor="include-payload" className="cursor-pointer font-normal">
                Incluir payload (JSON)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-hashes"
                checked={includeHashes}
                onCheckedChange={(c) => setIncludeHashes(!!c)}
              />
              <Label htmlFor="include-hashes" className="cursor-pointer font-normal">
                Incluir hashes (SHA-256)
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Gerar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
