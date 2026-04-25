import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DndaReportView } from '@/components/dnda/DndaReportView'

export function RelatoriosDnda({ pacientes }: { pacientes: any[] }) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [dndas, setDndas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const loadDndas = useCallback(async (id: string, isSilent = false) => {
    if (!id) return
    if (!isSilent) setLoading(true)
    try {
      setError(false)
      const records = await pb
        .collection('dnda')
        .getFullList({ filter: `paciente_id="${id}"`, sort: '-created' })
      setDndas(records)
    } catch {
      setError(true)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) loadDndas(selectedId)
    else setDndas([])
  }, [selectedId, loadDndas])

  useRealtime('dnda', () => {
    if (selectedId) loadDndas(selectedId, true)
  })

  const paciente = pacientes.find((p) => p.id === selectedId)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Selecione o paciente para análise DNDA™
        </label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pesquisar ou selecionar paciente..." />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedId ? (
        <DndaReportView paciente={paciente} dndas={dndas} loading={loading} error={error} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border border-slate-200 rounded-xl shadow-sm border-dashed">
          <p className="text-slate-500 font-medium">
            Selecione um paciente acima para carregar o relatório.
          </p>
        </div>
      )}
    </div>
  )
}
