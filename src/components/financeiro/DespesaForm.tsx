import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDespesa, getCategoriasDespesas } from '@/services/financeiro'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

const schema = z.object({
  data: z
    .string()
    .min(1, 'Obrigatório')
    .refine((val) => val <= today, {
      message: 'Data não pode ser no futuro',
    }),
  descricao: z
    .string()
    .min(1, 'Obrigatório')
    .transform((s) => s.trim()),
  valor: z.coerce.number().positive('Deve ser maior que zero'),
  tipo: z.enum(['Fixo', 'Variável'], { required_error: 'Obrigatório' }),
})

type FormData = z.infer<typeof schema>

export function DespesaForm({
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

  const [categoria, setCategoria] = useState<string>('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { data: today, valor: 0, descricao: '', tipo: '' as any },
  })

  const loadCategorias = useCallback(async () => {
    setFetchingCats(true)
    setFetchError(false)
    try {
      const data = await getCategoriasDespesas()
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

  const handleCategoriaChange = (val: string) => {
    setCategoria(val)
    const cat = dbCategorias.find((c) => c.id === val)
    if (cat) {
      form.setValue('tipo', cat.tipo)
    }
  }

  const onSubmit = async (d: FormData) => {
    if (!categoria) {
      toast({ variant: 'destructive', description: 'Selecione uma categoria' })
      return
    }

    const cat = dbCategorias.find((c) => c.id === categoria)
    const categoriaNome = cat ? cat.nome : categoria

    setLoading(true)
    try {
      await createDespesa({ ...d, categoria: categoriaNome, usuario_id: user.id })
      toast({ description: 'Despesa registrada!' })
      form.reset({ data: today, valor: 0, descricao: '' })
      setCategoria('')
      onSuccess()
    } catch (e) {
      toast({ variant: 'destructive', description: 'Erro ao adicionar despesa.' })
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
              value={categoria}
              onChange={(e) => handleCategoriaChange(e.target.value)}
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
          <Label>Tipo</Label>
          <Controller
            name="tipo"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''} disabled>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Variável">Variável</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.tipo && (
            <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input {...form.register('descricao')} placeholder="Ex: Pagamento internet" />
        {form.formState.errors.descricao && (
          <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Salvar Despesa
      </Button>
    </form>
  )
}
