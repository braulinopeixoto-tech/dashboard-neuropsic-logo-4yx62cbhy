import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createReceita, getCategoriasReceitas } from '@/services/financeiro'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'
import { Loader2 } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  data: z
    .string()
    .min(1, 'Obrigatório')
    .refine((val) => val <= today, {
      message: 'Data não pode ser no futuro',
    }),
  tipo: z.enum(['PIX', 'Dinheiro', 'Cartão'], { required_error: 'Obrigatório' }),
  valor: z.coerce.number().positive('Deve ser maior que zero'),
  local: z.enum(['Salvador', 'Seabra', 'Irecê', 'Consultas Online', 'Extras'], {
    required_error: 'Obrigatório',
  }),
  descricao: z
    .string()
    .min(1, 'Obrigatório')
    .transform((s) => s.trim()),
})

type FormData = z.infer<typeof schema>

export function ReceitaForm({
  categorias: _unusedCategorias,
  onSuccess,
}: {
  categorias?: any[]
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [fetchingCats, setFetchingCats] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [dbCategorias, setDbCategorias] = useState<any[]>([])

  const [categoria_receita, setCategoriaReceita] = useState<string>('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { data: today, valor: 0, descricao: '', tipo: '' as any, local: '' as any },
  })

  const loadCategorias = useCallback(async () => {
    setFetchingCats(true)
    setFetchError(false)
    try {
      const data = await getCategoriasReceitas()
      setDbCategorias(data)
    } catch (e) {
      setFetchError(true)
    } finally {
      setFetchingCats(false)
    }
  }, [])

  useEffect(() => {
    loadCategorias()
  }, [loadCategorias])

  const onSubmit = async (d: FormData) => {
    if (!categoria_receita) {
      sonnerToast.error('Selecione uma categoria')
      return
    }

    setLoading(true)
    try {
      await createReceita({ ...d, categoria_receita, usuario_id: user.id })
      toast({ description: 'Receita registrada!' })
      form.reset({ data: today, valor: 0, descricao: '' })
      setCategoriaReceita('')
      onSuccess()
    } catch (e) {
      toast({ variant: 'destructive', description: 'Erro ao adicionar receita.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input type="date" max={today} {...form.register('data')} />
          {form.formState.errors.data && (
            <p className="text-sm text-destructive">{form.formState.errors.data.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input type="number" step="0.01" {...form.register('valor')} />
          {form.formState.errors.valor && (
            <p className="text-sm text-destructive">{form.formState.errors.valor.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Controller
            name="tipo"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.tipo && (
            <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Local</Label>
          <Controller
            name="local"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Salvador">Salvador</SelectItem>
                  <SelectItem value="Seabra">Seabra</SelectItem>
                  <SelectItem value="Irecê">Irecê</SelectItem>
                  <SelectItem value="Consultas Online">Consultas Online</SelectItem>
                  <SelectItem value="Extras">Extras</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.local && (
            <p className="text-sm text-destructive">{form.formState.errors.local.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        {fetchingCats ? (
          <Skeleton className="h-10 w-full" />
        ) : fetchError ? (
          <div className="flex items-center justify-between text-sm text-destructive border border-destructive/20 rounded-md p-2 h-10 bg-destructive/10">
            <span>Erro ao carregar categorias</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadCategorias}
              className="h-6 px-2 text-xs"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <select
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={categoria_receita ?? ''}
            onChange={(e) => setCategoriaReceita(e.target.value)}
          >
            <option value="">Selecione uma categoria</option>
            {dbCategorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          {...form.register('descricao')}
          placeholder="Ex: Consulta João S."
          className="resize-none"
        />
        {form.formState.errors.descricao && (
          <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Receita
      </Button>
    </form>
  )
}
